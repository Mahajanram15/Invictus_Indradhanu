import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { SyncService } from '../services/sync';
import { StorageService } from '../services/storage';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // NetInfo's web reachability check defaults to pinging the bare domain
  // root, which 404s on a GitHub Pages *project* site (content only exists
  // under /<repo>/, not at the true root) — pointing it at the current page
  // instead guarantees a URL that actually exists.
  NetInfo.configure({
    reachabilityUrl: window.location.href,
  });
}

interface OfflineContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  pendingSyncCount: 0,
  isSyncing: false,
  syncNow: async () => {},
});

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const checkQueue = async () => {
    const queue = await StorageService.getSyncQueue();
    setPendingSyncCount(queue.length);
  };

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then((state) => {
      setIsOnline(!!state.isConnected);
      checkQueue();
    });

    // Subscriptions
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      setIsOnline(online);
      if (online) {
        syncNow();
      }
    });

    return () => unsubscribe();
  }, []);

  const syncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await SyncService.processOfflineQueue();
      await checkQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider value={{ isOnline, pendingSyncCount, isSyncing, syncNow }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);

