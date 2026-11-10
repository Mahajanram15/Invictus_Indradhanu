import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Phone, ShieldCheck, CheckCircle2, RotateCw } from 'lucide-react-native';
import { COLORS } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { FarmerButton } from '../../src/components/FarmerButton';

type LoginMode = 'signin' | 'signup' | 'verify-email';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, resendConfirmation } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<LoginMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [awaitingEmail, setAwaitingEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuthAction = async () => {
    if (!email.trim()) {
      setErrorMsg(t('errorEnterEmail') || 'Please enter your email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg(t('errorPasswordLength') || 'Password must be at least 6 characters');
      return;
    }

    if (mode === 'signup') {
      const cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        setErrorMsg(t('errorValidMobile') || 'Please enter a valid 10-digit mobile number for advisories');
        return;
      }
    }

    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (res.success) {
          if (res.isNewUser) {
            router.push('/auth/register');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          const errLower = (res.error || '').toLowerCase();
          if (errLower.includes('email not confirmed') || errLower.includes('unconfirmed')) {
            setAwaitingEmail(email.trim());
            setMode('verify-email');
            setErrorMsg(t('errorEmailNotConfirmed') || 'Email address not yet confirmed. Please verify your inbox.');
          } else {
            setErrorMsg(res.error || t('errorLoginFailed') || 'Login failed. Please check your credentials.');
          }
        }
      } else {
        const formattedPhone = `+91${phoneNumber.replace(/\D/g, '')}`;
        const res = await signUpWithEmail(email, password, formattedPhone);
        if (res.success) {
          // Outcome 1: Session is returned (email confirmation disabled or pre-confirmed)
          if (res.session) {
            router.push({
              pathname: '/auth/register',
              params: { phone: formattedPhone, email: email.trim() },
            });
          } else {
            // Outcome 2: User created without session (email confirmation required)
            setAwaitingEmail(email.trim());
            setMode('verify-email');
            setResendStatus('');
          }
        } else {
          setErrorMsg(res.error || t('errorRegistrationFailed') || 'Registration failed. Please try again.');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!awaitingEmail) return;
    setResending(true);
    setResendStatus('');
    setErrorMsg('');

    try {
      const res = await resendConfirmation(awaitingEmail);
      if (res.success) {
        setResendStatus(t('resendSuccessMsg') || 'Verification email resent! Please check your inbox.');
      } else {
        setErrorMsg(res.error || 'Failed to resend confirmation email.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Resend error');
    } finally {
      setResending(false);
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
            <Mail color={COLORS.primary} size={36} />
          </View>
          <Text style={styles.title}>
            {mode === 'verify-email'
              ? t('loginVerifyTitle') || 'Verify Your Email'
              : mode === 'signin'
              ? t('loginSignInTitle') || 'Farmer Sign In'
              : t('loginCreateTitle') || 'Create Farm Account'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'verify-email'
              ? t('loginVerifySubtitle') || 'Click the link in your email to activate your account.'
              : t('loginDevNotice') || 'Development Mode: Supabase email authentication is enabled.'}
          </Text>
        </View>

        {/* Tab Toggle (Hidden in verify-email mode) */}
        {mode !== 'verify-email' && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'signin' && styles.tabButtonActive]}
              onPress={() => {
                setMode('signin');
                setErrorMsg('');
              }}
            >
              <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                {t('tabSignIn') || 'Sign In'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'signup' && styles.tabButtonActive]}
              onPress={() => {
                setMode('signup');
                setErrorMsg('');
              }}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                {t('tabCreateAccount') || 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Normal Inputs (Sign In / Sign Up) */}
        {mode !== 'verify-email' ? (
          <View style={styles.inputArea}>
            <Text style={styles.inputLabel}>{t('emailAddress') || 'Email Address'} *</Text>
            <View style={styles.inputRow}>
              <Mail color={COLORS.textMuted} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder={t('emailPlaceholder') || 'kisan@example.com'}
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMsg) setErrorMsg('');
                }}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>{t('passwordLabel') || 'Password'} *</Text>
            <View style={styles.inputRow}>
              <Lock color={COLORS.textMuted} size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder={t('passwordPlaceholder') || 'Min 6 characters'}
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMsg) setErrorMsg('');
                }}
              />
            </View>

            {mode === 'signup' && (
              <>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>{t('contactMobile') || 'Contact Mobile Number'} *</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryCodeBadge}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneTextInput}
                    keyboardType="phone-pad"
                    placeholder="9876543210"
                    placeholderTextColor={COLORS.textMuted}
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={(val) => {
                      setPhoneNumber(val);
                      if (errorMsg) setErrorMsg('');
                    }}
                  />
                </View>
                <Text style={styles.helpText}>
                  {t('mobileHelpText') || 'Required for SMS, Voice IVR and WhatsApp climate alert delivery.'}
                </Text>
              </>
            )}

            {errorMsg ? <Text style={styles.errorText}>⚠️ {errorMsg}</Text> : null}

            <View style={styles.privacyNote}>
              <ShieldCheck color={COLORS.primary} size={18} />
              <Text style={styles.privacyText}>
                {t('credentialsSecureNote') || 'Credentials are secured via Supabase Auth with encrypted tokens and session persistence.'}
              </Text>
            </View>
          </View>
        ) : (
          /* Awaiting Email Verification State */
          <View style={styles.verifyContainer}>
            <View style={styles.verifyCard}>
              <Text style={styles.verifyCardTitle}>{t('confirmationLinkSentTitle') || 'Confirmation Link Sent'}</Text>
              <Text style={styles.verifyCardText}>
                {t('activationSentTo') || 'We sent an activation link to:'}
              </Text>
              <Text style={styles.verifyEmailHighlight}>{awaitingEmail}</Text>
              <Text style={styles.verifyInstructions}>
                1. {t('verifyStep1') || 'Open your email inbox'}{'\n'}
                2. {t('verifyStep2') || 'Tap the confirmation link'}{'\n'}
                3. {t('verifyStep3') || 'Return to Indradhanu and sign in with your password'}
              </Text>
            </View>

            {resendStatus ? (
              <View style={styles.successBanner}>
                <CheckCircle2 color={COLORS.primary} size={16} />
                <Text style={styles.successText}>{resendStatus}</Text>
              </View>
            ) : null}

            {errorMsg ? <Text style={styles.errorText}>⚠️ {errorMsg}</Text> : null}

            <View style={{ marginTop: 16 }}>
              <FarmerButton
                title={t('proceedSignIn') || 'Proceed to Sign In'}
                onPress={() => {
                  setEmail(awaitingEmail);
                  setMode('signin');
                  setErrorMsg('');
                }}
              />
            </View>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResend}
              disabled={resending}
            >
              <RotateCw color={COLORS.primaryDark} size={16} />
              <Text style={styles.resendBtnText}>
                {resending ? (t('resendingText') || 'Sending...') : (t('resendVerification') || 'Resend Verification Email')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {mode !== 'verify-email' && (
          <View style={styles.footerArea}>
            <FarmerButton
              title={mode === 'signin' ? (t('signInButton') || 'Sign In to Account') : (t('createContinueButton') || 'Create & Continue')}
              onPress={handleAuthAction}
              loading={loading}
            />
          </View>
        )}
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primaryDark,
  },
  inputArea: {
    marginVertical: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    borderRadius: 12,
    height: 52,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    backgroundColor: '#F1F5F9',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  helpText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    marginLeft: 2,
  },
  errorText: {
    color: COLORS.riskCritical,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primaryDark,
    marginLeft: 8,
    lineHeight: 16,
  },
  verifyContainer: {
    marginVertical: 18,
  },
  verifyCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 16,
  },
  verifyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 6,
  },
  verifyCardText: {
    fontSize: 13,
    color: '#78350F',
  },
  verifyEmailHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 10,
  },
  verifyInstructions: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 6,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 6,
  },
  footerArea: {
    marginBottom: 16,
  },
});
