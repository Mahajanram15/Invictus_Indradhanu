import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { UserCheck, MapPin, Globe, Phone, Crosshair } from 'lucide-react-native';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { FarmerButton } from '../../src/components/FarmerButton';
import { LocationService } from '../../src/services/location';
import { SupportedLanguage } from '../../src/localization/translations';

const LANG_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'en', label: 'English' },
];

export default function RegisterProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; email?: string }>();
  const { registerProfile, userPhone } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(params.phone || userPhone || '');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [capturingGps, setCapturingGps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCaptureGps = async () => {
    setCapturingGps(true);
    setErrorMsg('');
    try {
      const res = await LocationService.getCurrentLocation();
      if (res.coordinates) {
        setLatitude(res.coordinates.latitude.toString());
        setLongitude(res.coordinates.longitude.toString());
      } else {
        setErrorMsg(res.error || 'Failed to capture GPS. Enter coordinates manually.');
      }
    } finally {
      setCapturingGps(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setErrorMsg(t('enterFullName') || 'Please enter your full name');
      return;
    }
    const contactPhone = phoneNumber.trim() || userPhone || params.phone;
    if (!contactPhone || contactPhone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for advisories');
      return;
    }
    if (!village.trim()) {
      setErrorMsg(t('enterVillage') || 'Please enter your village name');
      return;
    }
    if (!district.trim()) {
      setErrorMsg(t('enterDistrict') || 'Please enter your district');
      return;
    }
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lonNum)) {
      setErrorMsg(t('captureGpsPrompt') || 'Please capture your farm\'s GPS location to continue');
      return;
    }

    const formattedPhone = contactPhone.startsWith('+') ? contactPhone : `+91${contactPhone.replace(/\D/g, '')}`;

    setErrorMsg('');
    setLoading(true);

    try {
      const res = await registerProfile({
        full_name: fullName.trim(),
        phone_number: formattedPhone,
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        preferred_language: language,
        latitude: latNum,
        longitude: lonNum,
      });

      if (res.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMsg(res.error || 'Failed to complete profile');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerArea}>
          <View style={styles.iconCircle}>
            <UserCheck color={COLORS.primary} size={36} />
          </View>
          <Text style={styles.title}>{t('farmerProfileTitle') || 'Farmer Profile Setup'}</Text>
          <Text style={styles.subtitle}>
            {t('farmerProfileDesc') || 'Complete your profile to receive localized crop and weather advisories.'}
          </Text>
        </View>

        <View style={styles.formArea}>
          <Text style={styles.label}>{t('fullName') || 'Full Name (नाव)'} *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ramesh Shankar Patil"
            placeholderTextColor={COLORS.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Mobile Number (मोबाईल क्रमांक) *</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="9876543210"
            placeholderTextColor={COLORS.textMuted}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <Text style={styles.label}>{t('village') || 'Village (गाव)'} *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Baramati"
            placeholderTextColor={COLORS.textMuted}
            value={village}
            onChangeText={setVillage}
          />

          <Text style={styles.label}>{t('district') || 'District (जिल्हा)'} *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Pune"
            placeholderTextColor={COLORS.textMuted}
            value={district}
            onChangeText={setDistrict}
          />

          <Text style={styles.label}>{t('farmLocation') || 'Farm GPS Location (स्थान)'} *</Text>
          <FarmerButton
            title={capturingGps ? t('detectingGps') || 'Capturing GPS...' : t('captureGps') || '📍 Capture GPS Location'}
            variant="secondary"
            onPress={handleCaptureGps}
            loading={capturingGps}
            icon={<Crosshair color={COLORS.white} size={20} />}
            style={{ marginVertical: 8 }}
          />
          {latitude && longitude ? (
            <Text style={styles.gpsCapturedText}>
              ✓ {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
            </Text>
          ) : null}

          <Text style={styles.label}>{t('preferredLanguage') || 'Advisory Language'}</Text>
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

          {errorMsg ? <Text style={styles.errorText}>⚠️ {errorMsg}</Text> : null}
        </View>

        <View style={styles.footerArea}>
          <FarmerButton
            title={t('saveAndContinue') || 'Save Profile & Continue'}
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  headerArea: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  formArea: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    height: 52,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.textDark,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
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
    fontWeight: '600',
    color: COLORS.textDark,
  },
  langChipTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  errorText: {
    color: COLORS.riskCritical,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  gpsCapturedText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 2,
    marginBottom: 4,
  },
  footerArea: {
    marginTop: 20,
    marginBottom: 10,
  },
});

