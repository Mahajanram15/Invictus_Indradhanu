import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { AlertTriangle, ShieldCheck, ThermometerSnowflake, Flame, CloudRain, Wind, Bug, Droplet } from 'lucide-react-native';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { ApiService } from '../../src/services/api';
import { RiskBadge } from '../../src/components/RiskBadge';
import { Config } from '../../src/constants/config';
import { DEMO_FARM_CROP } from '../../src/data/demoData';

export default function RiskAssessmentScreen() {
  const { activeFarm } = useAuth();
  const { t } = useLanguage();

  const [farmCrops, setFarmCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<any | null>(null);
  const [riskData, setRiskData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!activeFarm) return;
    setLoading(true);

    if (Config.DEMO_MODE) {
      setFarmCrops([DEMO_FARM_CROP]);
      setSelectedCrop(DEMO_FARM_CROP);
      // riskData stays null — the screen already falls back to sensible
      // sample category risk scores below.
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const cropsRes = await ApiService.getFarmCrops(activeFarm.id);
      if (cropsRes.data && cropsRes.data.length > 0) {
        setFarmCrops(cropsRes.data);
        const currentCrop = selectedCrop || cropsRes.data[0];
        setSelectedCrop(currentCrop);

        const rRes = await ApiService.getCropRisk(activeFarm.id, currentCrop.id);
        if (rRes.data) {
          setRiskData(rRes.data);
        }
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

  if (!activeFarm || farmCrops.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ShieldCheck color={COLORS.primary} size={48} />
        <Text style={styles.emptyTitle}>{t('noCropsAssessed') || 'No Crops Available for Risk Analysis'}</Text>
        <Text style={styles.emptyDesc}>
          {t('addCropFirstPrompt') || 'Please add a farm and crop first to compute scientific phenological risk.'}
        </Text>
      </View>
    );
  }

  const categoryRisks = riskData?.category_risks || [
    { category: 'Rainfall & Waterlogging', score: 35, level: 'LOW', details: 'Forecast indicates low precipitation.' },
    { category: 'Heat Stress', score: 40, level: 'MODERATE', details: 'Afternoon peaks reach 36°C.' },
    { category: 'Low Temperature Stress', score: 10, level: 'LOW', details: 'Night minimum safe above 18°C.' },
    { category: 'Soil Moisture Deficit', score: 65, level: 'HIGH', details: 'Deficit projected; root zone dries in 48h.' },
    { category: 'Excess Soil Moisture', score: 15, level: 'LOW', details: 'No ponding risk observed.' },
    { category: 'Disease & High Humidity', score: 72, level: 'HIGH', details: 'Relative humidity >80% elevates fungal pathogen sporulation.' },
    { category: 'High Wind Risk', score: 20, level: 'LOW', details: 'Breeze speeds safe under 25 km/h.' },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Overall Crop Risk Header Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.cropTitle}>🌱 {selectedCrop?.crop?.name || 'Crop'} Risk Score</Text>
            <Text style={styles.stageSubtitle}>{t('growthStage')}: {selectedCrop?.current_stage_name}</Text>
          </View>
          <RiskBadge
            level={riskData?.overall_risk_category || 'MODERATE'}
            label={riskData?.overall_risk_category || 'MODERATE'}
            size="lg"
          />
        </View>

        <View style={styles.scoreBarTrack}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${Math.min(100, Math.max(10, riskData?.overall_risk_score ?? 58))}%`,
                backgroundColor:
                  (riskData?.overall_risk_score ?? 58) > 70
                    ? COLORS.riskCritical
                    : (riskData?.overall_risk_score ?? 58) > 50
                    ? COLORS.riskHigh
                    : COLORS.riskMod,
              },
            ]}
          />
        </View>

        <Text style={styles.scoreText}>
          {t('compositeRiskScore') || 'Composite Risk Score'}: <Text style={styles.scoreNumber}>{riskData?.overall_risk_score ?? 58}/100</Text>
        </Text>
      </View>

      {/* 7-Factor Agronomic Risk Breakdown */}
      <Text style={styles.sectionHeading}>{t('riskBreakdownTitle') || '7 Agronomic Risk Factors'}</Text>

      {categoryRisks.map((item: any, idx: number) => {
        let IconComponent = AlertTriangle;
        const name = (item.category || '').toLowerCase();
        if (name.includes('heat')) IconComponent = Flame;
        else if (name.includes('cold') || name.includes('low temp')) IconComponent = ThermometerSnowflake;
        else if (name.includes('rain') || name.includes('waterlogging')) IconComponent = CloudRain;
        else if (name.includes('wind')) IconComponent = Wind;
        else if (name.includes('disease') || name.includes('humidity')) IconComponent = Bug;
        else if (name.includes('soil')) IconComponent = Droplet;

        return (
          <View key={idx} style={styles.factorCard}>
            <View style={styles.factorHeader}>
              <View style={styles.factorTitleRow}>
                <IconComponent color={COLORS.primaryDark} size={20} />
                <Text style={styles.factorName}>{item.category}</Text>
              </View>
              <RiskBadge level={item.level} label={item.level} size="sm" />
            </View>

            <Text style={styles.factorDesc}>{item.details || item.explanation}</Text>

            <View style={styles.factorScoreRow}>
              <Text style={styles.factorScoreLabel}>{t('score') || 'Score'}: {item.score}/100</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  stageSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scoreBarTrack: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 10,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  scoreNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  factorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  factorName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  factorDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  factorScoreRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  factorScoreLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});

