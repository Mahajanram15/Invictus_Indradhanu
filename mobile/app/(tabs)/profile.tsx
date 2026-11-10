import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Phone, MapPin, Award, Globe, LogOut, ShieldCheck, Database } from 'lucide-react-native';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { FarmerButton } from '../../src/components/FarmerButton';
import { SupportedLanguage } from '../../src/localization/translations';

const LANG_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'en', label: 'English' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { farmerProfile, userPhone, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = () => {
    const title = t('logout') || 'Log Out';
    const message = t('logoutConfirm') || 'Are you sure you want to sign out?';
    const doLogout = async () => {
      await logout();
      router.replace('/');
    };

    // react-native-web's Alert.alert() is a no-op, so the confirm dialog
    // would otherwise never appear (and logout would silently never fire)
    // when this screen is running on web.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
        doLogout();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: t('cancel') || 'Cancel', style: 'cancel' },
      { text: title, style: 'destructive', onPress: doLogout },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <User color={COLORS.white} size={36} />
        </View>
        <Text style={styles.farmerName}>{farmerProfile?.full_name || 'Farmer Profile'}</Text>
        <View style={styles.phoneTag}>
          <Phone color={COLORS.primary} size={14} />
          <Text style={styles.phoneText}>{userPhone || farmerProfile?.phone_number || 'Registered'}</Text>
        </View>
      </View>

      {/* Trust Score & Verified Farmer Badge */}
      <View style={styles.trustCard}>
        <View style={styles.trustLeft}>
          <Award color={COLORS.accent} size={28} />
          <View style={styles.trustTextCol}>
            <Text style={styles.trustTitle}>{t('trustScore') || 'Farmer Trust Score'}</Text>
            <Text style={styles.trustDesc}>{t('trustScoreDesc') || 'Earned through verified field actions & feedback'}</Text>
          </View>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreNumber}>{farmerProfile?.trust_score ?? 92}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
      </View>

      {/* Village & Location Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('locationDetails') || 'Location Details'}</Text>

        <View style={styles.detailRow}>
          <MapPin color={COLORS.textMuted} size={18} />
          <Text style={styles.detailLabel}>{t('village') || 'Village'}:</Text>
          <Text style={styles.detailValue}>{farmerProfile?.village || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MapPin color={COLORS.textMuted} size={18} />
          <Text style={styles.detailLabel}>{t('district') || 'District'}:</Text>
          <Text style={styles.detailValue}>{farmerProfile?.district || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <MapPin color={COLORS.textMuted} size={18} />
          <Text style={styles.detailLabel}>{t('state') || 'State'}:</Text>
          <Text style={styles.detailValue}>{farmerProfile?.state || 'Maharashtra'}</Text>
        </View>
      </View>

      {/* Advisory Language Switcher */}
      <View style={styles.sectionCard}>
        <View style={styles.langHeader}>
          <Globe color={COLORS.primary} size={18} />
          <Text style={styles.sectionTitle}>{t('preferredLanguage') || 'Advisory Language'}</Text>
        </View>

        <View style={styles.langGrid}>
          {LANG_OPTIONS.map((item) => {
            const isSelected = language === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[styles.langChip, isSelected && styles.langChipSelected]}
                onPress={() => setLanguage(item.code)}
              >
                <Text style={[styles.langChipText, isSelected && styles.langChipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Offline Storage & Security Info */}
      <View style={styles.infoRow}>
        <ShieldCheck color={COLORS.primary} size={16} />
        <Text style={styles.infoText}>
          {t('securityNotice') || 'End-to-end encrypted session with JWT token isolation.'}
        </Text>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutArea}>
        <FarmerButton
          title={t('logout') || 'Log Out (बाहेर पडा)'}
          variant="outline"
          onPress={handleLogout}
          icon={<LogOut color={COLORS.primary} size={18} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  farmerName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phoneText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF9C3',
    borderColor: COLORS.accent,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  trustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#854D0E',
  },
  trustDesc: {
    fontSize: 11,
    color: '#A16207',
    marginTop: 2,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#854D0E',
  },
  scoreMax: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginLeft: 8,
    width: 90,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
  },
  langHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  langChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F5E9',
  },
  langChipText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  langChipTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primaryDark,
  },
  logoutArea: {
    marginBottom: 24,
  },
});

