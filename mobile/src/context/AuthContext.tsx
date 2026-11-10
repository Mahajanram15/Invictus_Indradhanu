import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';
import { Config } from '../constants/config';
import { DEMO_FARMER_PROFILE, DEMO_FARM } from '../data/demoData';

export interface FarmerProfile {
  id: string;
  auth_user_id: string;
  phone_number: string;
  full_name: string;
  village: string;
  district: string;
  state: string;
  preferred_language: string;
  role: string;
  trust_score?: number;
}

export interface Farm {
  id: string;
  farmer_id: string;
  farm_name: string;
  latitude: number;
  longitude: number;
  size_acres: number;
  soil_type?: string;
  created_at?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userPhone: string | null;
  userEmail: string | null;
  farmerProfile: FarmerProfile | null;
  farms: Farm[];
  activeFarm: Farm | null;
  setActiveFarm: (farm: Farm) => void;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  signUpWithEmail: (email: string, password: string, phone?: string) => Promise<{
    success: boolean;
    session?: any;
    needsEmailConfirmation?: boolean;
    error?: string;
    message?: string;
  }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  registerProfile: (data: {
    full_name: string;
    village: string;
    district: string;
    state?: string;
    preferred_language: string;
    phone_number?: string;
    email?: string;
    latitude: number;
    longitude: number;
    farm_acreage?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userPhone: null,
  userEmail: null,
  farmerProfile: null,
  farms: [],
  activeFarm: null,
  setActiveFarm: () => {},
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  resendConfirmation: async () => ({ success: false }),
  sendOtp: async () => ({ success: false }),
  verifyOtp: async () => ({ success: false }),
  registerProfile: async () => ({ success: false }),
  refreshData: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarm, setActiveFarmState] = useState<Farm | null>(null);

  const refreshData = async () => {
    try {
      const profileRes = await ApiService.getFarmerProfile();
      if (profileRes.data) {
        setFarmerProfile(profileRes.data);
        setIsAuthenticated(true);

        const farmsRes = await ApiService.getFarms();
        if (farmsRes.data && farmsRes.data.length > 0) {
          setFarms(farmsRes.data);
          const savedActiveId = await StorageService.getActiveFarmId();
          const match = farmsRes.data.find((f: Farm) => f.id === savedActiveId);
          setActiveFarmState(match || farmsRes.data[0]);
        } else {
          setFarms([]);
          setActiveFarmState(null);
        }
      } else {
        setFarmerProfile(null);
      }
    } catch {
      // Offline or network error
    }
  };

  useEffect(() => {
    if (Config.DEMO_MODE) {
      // No live backend to call — go straight in as a sample farmer.
      setUserPhone(DEMO_FARMER_PROFILE.phone_number);
      setFarmerProfile(DEMO_FARMER_PROFILE);
      setFarms([DEMO_FARM]);
      setActiveFarmState(DEMO_FARM);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const session = await AuthService.getSession();
        if (session) {
          setUserPhone(session.user?.phone || session.user?.user_metadata?.phone_number || null);
          setUserEmail(session.user?.email || null);
          await refreshData();
        }
      } catch (e) {
        console.warn('Auth init failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const setActiveFarm = async (farm: Farm) => {
    setActiveFarmState(farm);
    await StorageService.saveActiveFarmId(farm.id);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const res = await AuthService.signInWithEmail(email, password);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    setUserEmail(email);
    setUserPhone(res.session?.user?.phone || res.session?.user?.user_metadata?.phone_number || null);
    setIsAuthenticated(true);

    const profileRes = await ApiService.getFarmerProfile();
    if (profileRes.data) {
      setFarmerProfile(profileRes.data);
      await refreshData();
      return { success: true, isNewUser: false };
    } else {
      return { success: true, isNewUser: true };
    }
  };

  const signUpWithEmail = async (email: string, password: string, phone?: string) => {
    const res = await AuthService.signUpWithEmail(email, password, phone);
    if (!res.success) {
      return { success: false, error: res.error };
    }
    if (res.session) {
      setUserEmail(email);
      setUserPhone(phone || null);
      setIsAuthenticated(true);
      return { success: true, session: res.session, needsEmailConfirmation: false, isNewUser: true };
    }
    return {
      success: true,
      session: null,
      needsEmailConfirmation: true,
      message: res.message || 'Account created! Please check your email inbox to verify your address before signing in.',
    };
  };

  const resendConfirmation = async (email: string) => {
    return await AuthService.resendVerificationEmail(email);
  };

  const sendOtp = async (phone: string) => {
    const res = await AuthService.signInWithOtp(phone);
    if (res.success) {
      setUserPhone(phone);
    }
    return res;
  };

  const verifyOtp = async (phone: string, token: string) => {
    const res = await AuthService.verifyOtp(phone, token);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    setUserPhone(phone);
    setIsAuthenticated(true);

    // Try fetching farmer profile
    const profileRes = await ApiService.getFarmerProfile();
    if (profileRes.data) {
      setFarmerProfile(profileRes.data);
      await refreshData();
      return { success: true, isNewUser: false };
    } else {
      // Farmer profile doesn't exist yet -> Needs registration
      return { success: true, isNewUser: true };
    }
  };

  const registerProfile = async (data: {
    full_name: string;
    village: string;
    district: string;
    state?: string;
    preferred_language: string;
    phone_number?: string;
    email?: string;
    latitude: number;
    longitude: number;
    farm_acreage?: number;
  }) => {
    // Idempotency guard: If farmerProfile is already set, return success
    if (farmerProfile) {
      return { success: true };
    }
    const res = await ApiService.registerFarmer({
      ...data,
      phone_number: data.phone_number || userPhone || undefined,
      email: data.email || userEmail || undefined,
    });
    if (res.data) {
      setFarmerProfile(res.data);
      await refreshData();
      return { success: true };
    }
    // Idempotent recovery if backend reports already registered on retry
    if (res.error && (res.error.includes('already registered') || res.error.includes('409'))) {
      await refreshData();
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to create profile' };
  };

  const logout = async () => {
    await AuthService.signOut();
    setIsAuthenticated(false);
    setUserPhone(null);
    setUserEmail(null);
    setFarmerProfile(null);
    setFarms([]);
    setActiveFarmState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userPhone,
        userEmail,
        farmerProfile,
        farms,
        activeFarm,
        setActiveFarm,
        signInWithEmail,
        signUpWithEmail,
        resendConfirmation,
        sendOtp,
        verifyOtp,
        registerProfile,
        refreshData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

