import { useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigationProp } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  BrandMark,
  Field,
  InlineMessage,
  PrimaryButton,
  ScreenIntro,
  ScreenLayout,
  SecondaryButton,
  TextButton,
} from '../components/PhaseOneUI';
import { AgriculturalBackdrop } from '../components/AgriculturalBackdrop';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import type { ApplicationRole } from '../types/role';
import { useRole } from '../hooks/useRole';

export function GetStartedScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'GetStarted'>) {
  const { error } = useAuth();

  return (
    <ScreenLayout>
      <BrandMark />
      <ScreenIntro eyebrow="From soil to sell" title="Growing a better tomorrow." description="A trusted path for farmers, buyers, and logistics partners to grow together." />
      <View style={styles.benefitList}>
        <Benefit title="Sell directly to verified buyers" description="Get better prices for your hard work." />
        <Benefit title="Manage your crops with ease" description="Track, update, and grow your produce." />
        <Benefit title="Join a trusted community" description="Together for a prosperous tomorrow." />
      </View>
      {error && <InlineMessage tone="info">Supabase is not configured. Mock OTP can run without it; real authentication needs public Supabase credentials.</InlineMessage>}
      <PrimaryButton label="Continue" onPress={() => navigation.navigate('LanguageSelection')} />
      <TextButton label="Skip" onPress={() => navigation.navigate('LanguageSelection')} />
    </ScreenLayout>
  );
}

function Benefit({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}><View style={styles.leaf} /></View>
      <View style={styles.benefitCopy}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitDescription}>{description}</Text></View>
    </View>
  );
}

export function LanguageSelectionScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'LanguageSelection'>) {
  const { language, setLanguage, supportedLanguages, error } = useLanguage();
  const [saving, setSaving] = useState(false);

  const continueToLogin = async () => {
    setSaving(true);
    await setLanguage(language);
    setSaving(false);
    navigation.navigate('PhoneLogin');
  };

  return (
    <ScreenLayout>
      <BrandMark />
      <ScreenIntro eyebrow="Your preference" title="Choose your language" description="Select your preferred language to continue." />
      <View style={styles.optionList}>
        {supportedLanguages.map((code) => (
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: language === code }} key={code} onPress={() => void setLanguage(code)} style={[styles.languageOption, language === code && styles.languageOptionSelected]}>
            <View style={[styles.radio, language === code && styles.radioSelected]} />
            <Text style={styles.optionText}>{code === 'en' ? 'English' : code}</Text>
          </Pressable>
        ))}
      </View>
      {error && <InlineMessage tone="info">Your choice is saved locally and will sync when possible.</InlineMessage>}
      <PrimaryButton label="Continue" loading={saving} onPress={() => void continueToLogin()} />
    </ScreenLayout>
  );
}

export function PhoneLoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>) {
  return <PhoneAuthScreen navigation={navigation} mode="login" />;
}

export function SignUpScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'SignUp'>) {
  return <PhoneAuthScreen navigation={navigation} mode="signup" />;
}

function PhoneAuthScreen({ navigation, mode }: { navigation: NavigationProp<AuthStackParamList>; mode: 'login' | 'signup' }) {
  const { requestOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sentPhone, setSentPhone] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const sendOtp = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await requestOtp(phone);
      setPhone(result.phone);
      setSentPhone(result.phone);
      setOtp('');
      setSeconds(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not send the OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async () => {
    if (otp.length !== 6) {
      setMessage('Enter the 6-digit OTP sent to your phone.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await verifyOtp(sentPhone ?? phone, otp);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not verify the OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.authBackground}>
      <AgriculturalBackdrop dim />
      <ScreenLayout>
        <View style={styles.authCard}>
          <BrandMark />
          <ScreenIntro title={mode === 'login' ? 'Welcome back' : 'Join FarmPrism'} description="From soil to sell, we grow together." />
          <View style={styles.form}>
            <Field label="Phone Number" placeholder="Enter your mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />
            <PrimaryButton label="Send OTP" loading={submitting && !sentPhone} onPress={() => void sendOtp()} />
            {sentPhone && <>
              <Text style={styles.or}>OR</Text>
              <Text style={styles.fieldLabel}>Enter OTP</Text>
              <View style={styles.otpRow}>
                {Array.from({ length: 6 }, (_, index) => (
                  <TextInput
                    accessibilityLabel={`OTP digit ${index + 1} of 6`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="number-pad"
                    key={index}
                    maxLength={6}
                    onChangeText={(value) => {
                      const digits = value.replace(/\D/g, '');
                      if (digits.length > 1) {
                        setOtp(digits.slice(0, 6));
                        otpRefs.current[Math.min(digits.length, 6) - 1]?.focus();
                        return;
                      }
                      const next = otp.split('');
                      next[index] = digits;
                      setOtp(next.join('').slice(0, 6));
                      if (digits && index < 5) otpRefs.current[index + 1]?.focus();
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
                    }}
                    ref={(input) => { otpRefs.current[index] = input; }}
                    style={styles.otpInput}
                    value={otp[index] ?? ''}
                  />
                ))}
              </View>
              <Text style={styles.resend}>Didn't receive OTP? {seconds > 0 ? `Resend in 00:${String(seconds).padStart(2, '0')}` : 'Resend'}</Text>
              <PrimaryButton label="Login" loading={submitting && Boolean(sentPhone)} onPress={() => void verify()} />
              {seconds === 0 && <TextButton label="Resend OTP" onPress={() => void sendOtp()} />}
            </>}
            {message && <InlineMessage>{message}</InlineMessage>}
            <View style={styles.security}><Text style={styles.securityTitle}>Secure & Trusted</Text><Text style={styles.securityCopy}>Your data is protected with secure authentication.</Text></View>
            <TextButton label={mode === 'login' ? "Don't have an account? Sign Up" : 'Back to Login'} onPress={() => navigation.navigate(mode === 'login' ? 'SignUp' : 'PhoneLogin')} />
          </View>
        </View>
      </ScreenLayout>
    </View>
  );
}

export function RoleSelectionScreen() {
  const { availableRoles, error, reloadRoles, selectRole } = useRole();
  const [selecting, setSelecting] = useState<string | null>(null);

  const chooseRole = async (roleId: string) => { setSelecting(roleId); await selectRole(roleId); setSelecting(null); };

  return (
    <ScreenLayout>
      <BrandMark />
      <ScreenIntro title="Choose your role" description="Select how you want to join the FarmPrism ecosystem." />
      <View style={styles.roleGrid}>
        {availableRoles.map((role) => <RoleCard key={role.id} role={role.code} loading={selecting === role.id} onPress={() => void chooseRole(role.id)} />)}
        <RoleCard role="fpo" disabled />
      </View>
      {availableRoles.length === 0 && <InlineMessage tone="info">No active application role is assigned to this account.</InlineMessage>}
      {error && <><InlineMessage>{error.message}</InlineMessage><SecondaryButton label="Try again" onPress={() => void reloadRoles()} /></>}
    </ScreenLayout>
  );
}

function RoleCard({ role, onPress, loading = false, disabled = false }: { role: ApplicationRole | 'fpo'; onPress?: () => void; loading?: boolean; disabled?: boolean }) {
  const labels = { farmer: 'Farmer', buyer: 'Buyer Marketplace', logistics: 'Logistics Console', fpo: 'FPO Dashboard' };
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled || loading} onPress={onPress} style={[styles.roleCard, disabled && styles.roleCardDisabled]}><RoleGlyph role={role} /><Text style={styles.roleTitle}>{labels[role]}</Text><Text style={styles.roleDescription}>{disabled ? 'Coming Soon' : loading ? 'Opening your workspace...' : 'Select role'}</Text></Pressable>;
}

function RoleGlyph({ role }: { role: ApplicationRole | 'fpo' }) {
  return <View style={styles.roleGlyph}><View style={[styles.roleGlyphShape, role === 'fpo' && styles.roleGlyphFuture]} /><View style={styles.roleGlyphStem} /></View>;
}

export function RoleDashboardPlaceholder({ role }: { role: ApplicationRole }) {
  const { logout } = useAuth();
  return <ScreenLayout><BrandMark /><ScreenIntro title={`${role[0].toUpperCase()}${role.slice(1)} workspace`} description="Your role-specific FarmPrism experience will appear here." /><SecondaryButton label="Log out" onPress={() => void logout()} /></ScreenLayout>;
}

const styles = StyleSheet.create({
  benefitList: { gap: 12, marginBottom: 28 },
  benefit: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E3E6D8', borderRadius: 14, borderWidth: 1, flexDirection: 'row', padding: 14 },
  benefitIcon: { alignItems: 'center', backgroundColor: '#EEF3DF', borderRadius: 26, height: 52, justifyContent: 'center', width: 52 },
  leaf: { backgroundColor: '#39733C', borderBottomLeftRadius: 15, borderTopRightRadius: 15, height: 22, transform: [{ rotate: '-35deg' }], width: 12 },
  benefitCopy: { flex: 1, marginLeft: 14 },
  benefitTitle: { color: '#23412D', fontSize: 16, fontWeight: '700' },
  benefitDescription: { color: '#53645A', fontSize: 14, marginTop: 4 },
  optionList: { gap: 12, marginBottom: 28 },
  languageOption: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#D6E0D5', borderRadius: 10, borderWidth: 1, flexDirection: 'row', minHeight: 58, paddingHorizontal: 16 },
  languageOptionSelected: { borderColor: '#2E7042', borderWidth: 2 },
  radio: { borderColor: '#A7B7A9', borderRadius: 10, borderWidth: 2, height: 20, marginRight: 12, width: 20 },
  radioSelected: { backgroundColor: '#2E7042', borderColor: '#2E7042' },
  optionText: { color: '#23412D', fontSize: 16, fontWeight: '600' },
  authBackground: { flex: 1, backgroundColor: '#6D8B4B' },
  authCard: { backgroundColor: '#FFFDF7', borderRadius: 24, padding: 22 },
  form: { gap: 16 },
  fieldLabel: { color: '#23412D', fontSize: 14, fontWeight: '700' },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  otpInput: { backgroundColor: '#FFFFFF', borderColor: '#B8C9B8', borderRadius: 8, borderWidth: 1, color: '#23412D', fontSize: 20, fontWeight: '700', height: 54, textAlign: 'center', width: 42 },
  or: { color: '#53645A', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  resend: { color: '#53645A', fontSize: 14, textAlign: 'center' },
  security: { backgroundColor: '#EEF2DE', borderColor: '#D5DFC0', borderRadius: 10, padding: 14 },
  securityTitle: { color: '#23412D', fontSize: 15, fontWeight: '700' },
  securityCopy: { color: '#53645A', fontSize: 13, lineHeight: 19, marginTop: 4 },
  roleGrid: { gap: 14 },
  roleCard: { backgroundColor: '#FFFFFF', borderColor: '#D6E0D5', borderRadius: 14, borderWidth: 1, padding: 18 },
  roleCardDisabled: { backgroundColor: '#F3F4EC', opacity: 0.8 },
  roleGlyph: { height: 32, position: 'relative', width: 32 },
  roleGlyphShape: { backgroundColor: '#39733C', borderRadius: 12, height: 22, left: 3, position: 'absolute', top: 2, transform: [{ rotate: '45deg' }], width: 22 },
  roleGlyphFuture: { backgroundColor: '#A7B7A9', borderRadius: 16, borderWidth: 3, borderColor: '#7B927D' },
  roleGlyphStem: { backgroundColor: '#39733C', bottom: 0, height: 14, left: 15, position: 'absolute', width: 2 },
  roleTitle: { color: '#23412D', fontSize: 19, fontWeight: '700', marginTop: 8 },
  roleDescription: { color: '#39733C', fontSize: 14, fontWeight: '700', marginTop: 6 },
});
