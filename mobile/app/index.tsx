import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CloudSun, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../src/constants/colors';
import { useLanguage } from '../src/context/LanguageContext';
import { useAuth } from '../src/context/AuthContext';
import { FarmerButton } from '../src/components/FarmerButton';
import { SupportedLanguage } from '../src/localization/translations';
import { Config } from '../src/constants/config';

const LANGUAGES: { code: SupportedLanguage; label: string; native: string; description: string }[] = [
  { code: 'mr', label: 'Marathi', native: 'मराठी', description: 'महाराष्ट्रातील शेतकऱ्यांसाठी' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी', description: 'उत्तर व मध्य भारतातील शेतकऱ्यांसाठी' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', description: 'ఆంధ్రప్రదేశ్, తెలంగాణ రైతులకు' },
  { code: 'en', label: 'English', native: 'English', description: 'Standard advisory terminology' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // In demo mode there's no real session to restore, so isAuthenticated is
    // always true — don't auto-redirect away from this screen on load, or a
    // visitor (and any refresh) would never see the language picker again.
    if (Config.DEMO_MODE) return;
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
  };

  const handleContinue = () => {
    // No real backend to log into in demo mode — go straight into the app.
    router.push(Config.DEMO_MODE ? '/(tabs)' : '/auth/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <CloudSun color={COLORS.white} size={48} />
        </View>
        <Text style={styles.appTitle}>INDRADHANU</Text>
        <Text style={styles.appSubtitle}>इंद्रधनु • हवामान व पीक सल्ला प्रणाली</Text>
        <Text style={styles.tagline}>{t('welcomeMessage')}</Text>
      </View>

      <View style={styles.selectionSection}>
        <Text style={styles.sectionHeader}>{t('selectLanguage')}</Text>

        {LANGUAGES.map((item) => {
          const isSelected = language === item.code;
          return (
            <TouchableOpacity
              key={item.code}
              style={[styles.langCard, isSelected && styles.langCardSelected]}
              onPress={() => handleSelectLanguage(item.code)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <Text style={[styles.nativeText, isSelected && styles.textSelected]}>
                  {item.native}
                </Text>
                <Text style={styles.labelSubText}>
                  {item.label} • {item.description}
                </Text>
              </View>

              {isSelected ? (
                <CheckCircle2 color={COLORS.primary} size={26} />
              ) : (
                <View style={styles.unselectedRadio} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footerSection}>
        <FarmerButton
          title={t('continue') || 'Continue'}
          onPress={handleContinue}
          icon={<ArrowRight color={COLORS.white} size={20} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primaryDark,
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  selectionSection: {
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  langCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  cardLeft: {
    flex: 1,
  },
  nativeText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  textSelected: {
    color: COLORS.primaryDark,
  },
  labelSubText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  unselectedRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderColor: COLORS.border,
    borderWidth: 2,
  },
  footerSection: {
    marginTop: 16,
    marginBottom: 16,
  },
});

