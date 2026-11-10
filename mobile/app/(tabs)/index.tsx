import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Sprout, Clock, AlertCircle, CheckCircle, Droplets, History, RefreshCw, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useOffline } from '../../src/context/OfflineContext';
import { ApiService } from '../../src/services/api';
import { StorageService } from '../../src/services/storage';
import { AudioPlayer } from '../../src/components/AudioPlayer';
import { RiskBadge } from '../../src/components/RiskBadge';
import { FarmerButton } from '../../src/components/FarmerButton';

export default function HomeScreen() {
  const router = useRouter();
  const { activeFarm, farms, setActiveFarm, farmerProfile } = useAuth();
  const { t, language } = useLanguage();
  const { isOnline } = useOffline();

  const [farmCrops, setFarmCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<any | null>(null);
  const [advisory, setAdvisory] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const loadData = async () => {
    if (!activeFarm) return;
    setLoading(true);

    try {
      const cropsRes = await ApiService.getFarmCrops(activeFarm.id);
      if (cropsRes.data && cropsRes.data.length > 0) {
        setFarmCrops(cropsRes.data);
        const currentCrop = selectedCrop || cropsRes.data[0];
        setSelectedCrop(currentCrop);

        // Fetch latest advisory for this crop, in the farmer's currently selected language
        const advRes = await ApiService.getLatestAdvisory(activeFarm.id, currentCrop.id, language);
        if (advRes.data) {
          setAdvisory(advRes.data);
          setIsCached(!!advRes.isOfflineCache);
        } else {
          setAdvisory(null);
        }
      } else {
        setFarmCrops([]);
        setSelectedCrop(null);
        setAdvisory(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFarm]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleGenerateFresh = async () => {
    if (!activeFarm || !selectedCrop) return;
    setLoading(true);
    try {
      const res = await ApiService.generateAdvisory(
        activeFarm.id,
        selectedCrop.id,
        // Prefer the app's current language selection over the farmer's
        // registration-time preference, since the user may have switched
        // languages since registering and expects advisories to follow.
        language || farmerProfile?.preferred_language || 'mr'
      );
      if (res.data) {
        setAdvisory(res.data);
        setIsCached(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAction = async () => {
    if (!advisory) return;

    const payload = {
      action_taken: 'APPLIED',
      water_saved_liters: 2500,
      cost_saved_inr: 450,
      feedback_notes: 'Applied via Farmer Mobile App',
    };

    if (!isOnline) {
      await StorageService.addToSyncQueue({
        type: 'ADVISORY_FEEDBACK',
        payload: { advisoryId: advisory.id, feedback: payload },
        timestamp: Date.now(),
      });
      setFeedbackSubmitted(true);
      Alert.alert(t('savedOffline') || 'Saved Offline', t('actionSavedOfflineDesc') || 'Action recorded. Will sync automatically when connection returns.');
      return;
    }

    try {
      await ApiService.submitAdvisoryFeedback(advisory.id, payload);
      setFeedbackSubmitted(true);
      Alert.alert('यशस्वी (Success)', t('actionRecorded') || 'Action verified! Water & cost savings added to your trust score.');
    } catch {
      // Offline fallback
      await StorageService.addToSyncQueue({
        type: 'ADVISORY_FEEDBACK',
        payload: { advisoryId: advisory.id, feedback: payload },
        timestamp: Date.now(),
      });
      setFeedbackSubmitted(true);
    }
  };

  if (!activeFarm) {
    return (
      <View style={styles.emptyContainer}>
        <Sprout color={COLORS.primary} size={64} />
        <Text style={styles.emptyTitle}>{t('noFarmsRegistered') || 'No Farm Registered Yet'}</Text>
        <Text style={styles.emptyDesc}>
          {t('registerFarmPrompt') || 'Add your farm location using GPS to start receiving climate and crop advisories.'}
        </Text>
        <FarmerButton
          title={t('addFarm') || 'Add Farm with GPS'}
          onPress={() => router.push('/farms/add')}
          style={{ width: '80%', marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Farm & Crop Selector Strip */}
      <View style={styles.selectorBar}>
        <View style={styles.farmInfo}>
          <Text style={styles.farmLabel}>{t('activePlot') || 'Active Farm'}:</Text>
          <Text style={styles.farmName}>{activeFarm.farm_name} ({activeFarm.size_acres} ac)</Text>
        </View>

        {farmCrops.length > 0 && selectedCrop && (
          <TouchableOpacity
            style={styles.cropBadge}
            onPress={() => router.push(`/crops/${selectedCrop.id}/stage`)}
          >
            <Text style={styles.cropBadgeText}>🌱 {selectedCrop.crop?.name || 'Crop'} ({selectedCrop.current_stage_name})</Text>
            <ChevronRight color={COLORS.primary} size={16} />
          </TouchableOpacity>
        )}
      </View>

      {/* Offline Data Tag */}
      {isCached && (
        <View style={styles.offlineNotice}>
          <Text style={styles.offlineNoticeText}>💾 {t('viewingCachedAdvisory') || 'Viewing offline cached advisory'}</Text>
        </View>
      )}

      {/* Main Advisory Card */}
      {advisory ? (
        <View style={styles.advisoryCard}>
          <View style={styles.cardHeader}>
            <View style={styles.urgencyRow}>
              <RiskBadge level={advisory.urgency || 'HIGH'} label={advisory.urgency || 'HIGH'} />
              <View style={styles.dateTag}>
                <Clock color={COLORS.textMuted} size={14} />
                <Text style={styles.dateText}>{advisory.recommended_timing || 'Next 24h'}</Text>
              </View>
              <TouchableOpacity
                style={styles.regenerateBtn}
                onPress={handleGenerateFresh}
                disabled={loading}
              >
                <RefreshCw color={COLORS.primaryDark} size={16} />
              </TouchableOpacity>
            </View>

            {/* Audio Voice Note Player */}
            <AudioPlayer
              textToSpeak={`${advisory.immediate_action}. ${advisory.why_it_matters}. ${advisory.risk_if_ignored}`}
              label={t('listenAdvisory')}
            />
          </View>

          {/* 1. What action to take */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>🎯 {t('whatAction') || 'Immediate Action (काय करावे)'}</Text>
            <Text style={styles.actionText}>{advisory.immediate_action}</Text>
          </View>

          {/* 2. Why it matters */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>💡 {t('whyItMatters') || 'Why It Matters (कारण काय)'}</Text>
            <Text style={styles.bodyText}>{advisory.why_it_matters}</Text>
          </View>

          {/* 3. Risk if ignored */}
          <View style={[styles.sectionBlock, styles.dangerBlock]}>
            <View style={styles.dangerHeader}>
              <AlertCircle color={COLORS.riskCritical} size={16} />
              <Text style={styles.dangerLabel}>{t('riskIfIgnored') || 'Risk If Ignored (दुर्लक्ष केल्यास नुकसान)'}</Text>
            </View>
            <Text style={styles.dangerText}>{advisory.risk_if_ignored}</Text>
          </View>

          {/* 4. Projected Impact */}
          {advisory.projected_impact ? (
            <View style={styles.impactBlock}>
              <Droplets color={COLORS.skyBlue} size={18} />
              <Text style={styles.impactText}>{advisory.projected_impact}</Text>
            </View>
          ) : null}

          {/* One-Tap Action Confirmation */}
          <View style={styles.actionRow}>
            <FarmerButton
              title={feedbackSubmitted ? `✓ ${t('actionApplied') || 'Action Done'}` : `✓ ${t('iAppliedThis') || 'I Did This Action'}`}
              onPress={handleApplyAction}
              disabled={feedbackSubmitted}
              variant={feedbackSubmitted ? 'secondary' : 'primary'}
            />
          </View>
        </View>
      ) : (
        <View style={styles.noAdvisoryCard}>
          <Text style={styles.noAdvisoryTitle}>{t('noAdvisoryYet') || 'No Advisory Generated Yet'}</Text>
          <Text style={styles.noAdvisoryDesc}>
            {farmCrops.length === 0
              ? t('registerCropPrompt') || 'Please register a crop to calculate risk and generate climate advisories.'
              : t('generateAdvisoryPrompt') || 'Tap below to analyze current weather and generate a localized AI advisory.'}
          </Text>

          {farmCrops.length === 0 ? (
            <FarmerButton
              title={t('registerCrop') || 'Register Crop'}
              onPress={() => router.push('/crops/add')}
              style={{ marginTop: 14 }}
            />
          ) : (
            <FarmerButton
              title={t('generateAdvisory') || 'Generate Advisory Now'}
              onPress={handleGenerateFresh}
              loading={loading}
              icon={<RefreshCw color={COLORS.white} size={18} />}
              style={{ marginTop: 14 }}
            />
          )}
        </View>
      )}

      {/* Quick Navigation Strip */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity
          style={styles.quickNavBtn}
          onPress={() => router.push('/advisories/history')}
        >
          <History color={COLORS.primary} size={20} />
          <Text style={styles.quickNavText}>{t('advisoryHistory') || 'History'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickNavBtn}
          onPress={() => router.push('/settings/notifications')}
        >
          <Text style={styles.quickNavText}>🔔 {t('channelPreferences') || 'Alerts'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  selectorBar: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  farmInfo: {
    marginBottom: 8,
  },
  farmLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  farmName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  cropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  cropBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  offlineNotice: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  offlineNoticeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  advisoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 10,
  },
  urgencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
    fontWeight: '600',
  },
  regenerateBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  sectionBlock: {
    marginVertical: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
    lineHeight: 26,
  },
  bodyText: {
    fontSize: 15,
    color: COLORS.textDark,
    lineHeight: 22,
  },
  dangerBlock: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.riskCritical,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dangerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.riskCritical,
    marginLeft: 4,
  },
  dangerText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
    fontWeight: '600',
  },
  impactBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  impactText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.skyBlue,
    marginLeft: 8,
    flex: 1,
  },
  actionRow: {
    marginTop: 14,
  },
  noAdvisoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noAdvisoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  noAdvisoryDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  quickNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  quickNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickNavText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginLeft: 6,
  },
});

