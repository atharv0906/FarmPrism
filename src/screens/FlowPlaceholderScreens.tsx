import { useState, type ReactNode } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BrandMark,
  Divider,
  Field,
  InlineMessage,
  PrimaryButton,
  ScreenIntro,
  ScreenLayout,
  SecondaryButton,
  TextButton,
} from '../components/PhaseOneUI';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useRole } from '../hooks/useRole';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import type { ApplicationRole } from '../types/role';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function GetStartedScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'GetStarted'>) {
  const { error } = useAuth();

  return (
    <ScreenLayout>
      <BrandMark />
      <ScreenIntro
        eyebrow="A clearer path from farm to market"
        title="Better choices start with better connections."
        description="FarmPrism brings farmers, buyers, and logistics partners into one trusted marketplace."
      />
      {error && <InlineMessage tone="info">We could not restore your previous session. Please sign in again.</InlineMessage>}
      <PrimaryButton label="Get started" onPress={() => navigation.navigate('LanguageSelection')} />
    </ScreenLayout>
  );
}

export function LanguageSelectionScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'LanguageSelection'>) {
  const { language, setLanguage, supportedLanguages, error } = useLanguage();
  const [saving, setSaving] = useState(false);

  const continueToAuthentication = async () => {
    setSaving(true);
    await setLanguage(language);
    setSaving(false);
    navigation.navigate('Authentication');
  };

  return (
    <ScreenLayout>
      <BrandMark />
      <ScreenIntro
        eyebrow="Your preference"
        title="Choose your language"
        description="You can change this later as FarmPrism grows."
      />
      <View style={styles.optionList}>
        {supportedLanguages.map((code) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: language === code }}
            key={code}
            onPress={() => void setLanguage(code)}
            style={[styles.languageOption, language === code && styles.languageOptionSelected]}
          >
            <View style={[styles.radio, language === code && styles.radioSelected]} />
            <Text style={styles.optionText}>{code === 'en' ? 'English' : code}</Text>
          </Pressable>
        ))}
      </View>
      {error && <InlineMessage tone="info">Your choice will be saved locally and synced when possible.</InlineMessage>}
      <PrimaryButton
        label="Continue"
        loading={saving}
        onPress={() => void continueToAuthentication()}
      />
    </ScreenLayout>
  );
}

export function AuthenticationScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Authentication'>) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }
    if (!password) {
      setMessage('Enter your password.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await login(email.trim(), password);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not sign you in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout>
      <BrandMark />
      <ScreenIntro title="Welcome back" description="Sign in to continue to your FarmPrism workspace." />
      <View style={styles.form}>
        <Field
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {message && <InlineMessage>{message}</InlineMessage>}
        <PrimaryButton label="Log in" loading={submitting} onPress={() => void submit()} />
        <TextButton label="Forgot password?" onPress={() => navigation.navigate('ForgotPassword')} />
        <Divider />
        <SecondaryButton label="Create an account" onPress={() => navigation.navigate('SignUp')} />
      </View>
    </ScreenLayout>
  );
}

export function SignUpScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'SignUp'>) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!fullName.trim()) {
      setMessage('Enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setMessage('Your password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const result = await signUp(email.trim(), password, fullName.trim());
      if (result.requiresEmailVerification) {
        navigation.navigate('EmailVerification', { email: email.trim() });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not create your account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout>
      <ScreenIntro title="Create your account" description="Set up your FarmPrism access in a few steps." />
      <View style={styles.form}>
        <Field label="Full name" placeholder="Your full name" value={fullName} onChangeText={setFullName} />
        <Field
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />
        <Field label="Password" placeholder="At least 6 characters" secureTextEntry value={password} onChangeText={setPassword} />
        <Field label="Confirm password" placeholder="Repeat your password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
        {message && <InlineMessage>{message}</InlineMessage>}
        <PrimaryButton label="Create account" loading={submitting} onPress={() => void submit()} />
        <TextButton label="Back to login" onPress={() => navigation.navigate('Authentication')} />
      </View>
    </ScreenLayout>
  );
}

export function ForgotPasswordScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not send the reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout>
      <ScreenIntro title="Reset your password" description="Enter your email and we will send instructions to reset your password." />
      <View style={styles.form}>
        <Field
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />
        {sent && <InlineMessage tone="info">Check your email for a password reset link.</InlineMessage>}
        {message && <InlineMessage>{message}</InlineMessage>}
        <PrimaryButton label="Send reset link" loading={submitting} onPress={() => void submit()} />
        <TextButton label="Back to login" onPress={() => navigation.navigate('Authentication')} />
      </View>
    </ScreenLayout>
  );
}

export function EmailVerificationScreen({ route, navigation }: NativeStackScreenProps<AuthStackParamList, 'EmailVerification'>) {
  return (
    <ScreenLayout>
      <BrandMark />
      <ScreenIntro
        eyebrow="One last step"
        title="Verify your email"
        description={`We sent a verification link to ${route.params.email}. Confirm your email before signing in.`}
      />
      <PrimaryButton label="Back to login" onPress={() => navigation.navigate('Authentication')} />
    </ScreenLayout>
  );
}

export function RoleSelectionScreen() {
  const { availableRoles, error, reloadRoles, selectRole } = useRole();
  const [selecting, setSelecting] = useState<string | null>(null);

  const chooseRole = async (roleId: string) => {
    setSelecting(roleId);
    await selectRole(roleId);
    setSelecting(null);
  };

  return (
    <ScreenLayout>
      <ScreenIntro title="Choose your role" description="Select how you will use FarmPrism. You can only choose roles assigned to your account." />
      <View style={styles.roleList}>
        {availableRoles.map((role) => (
          <Pressable
            accessibilityRole="button"
            disabled={selecting !== null}
            key={role.id}
            onPress={() => void chooseRole(role.id)}
            style={({ pressed }) => [styles.roleCard, pressed && styles.cardPressed]}
          >
            <Text style={styles.roleTitle}>{roleLabel(role.code)}</Text>
            <Text style={styles.roleHint}>{selecting === role.id ? 'Opening your workspace...' : 'Continue'}</Text>
          </Pressable>
        ))}
      </View>
      {availableRoles.length === 0 && <InlineMessage tone="info">No application role is assigned to this account yet.</InlineMessage>}
      {error && <InlineMessage>{error.message}</InlineMessage>}
      {error && <SecondaryButton label="Try again" onPress={() => void reloadRoles()} />}
    </ScreenLayout>
  );
}

export function RoleDashboardPlaceholder({ role }: { role: ApplicationRole }) {
  const { logout } = useAuth();

  return (
    <ScreenLayout>
      <BrandMark />
      <ScreenIntro title={`${roleLabel(role)} workspace`} description="Your role-specific FarmPrism experience will appear here." />
      <SecondaryButton label="Log out" onPress={() => void logout()} />
    </ScreenLayout>
  );
}

function roleLabel(role: ApplicationRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
  },
  optionList: {
    gap: 12,
    marginBottom: 28,
  },
  languageOption: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E0D5',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 16,
  },
  languageOptionSelected: {
    borderColor: '#2E7042',
    borderWidth: 2,
  },
  radio: {
    borderColor: '#A7B7A9',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    marginRight: 12,
    width: 20,
  },
  radioSelected: {
    backgroundColor: '#2E7042',
    borderColor: '#2E7042',
  },
  optionText: {
    color: '#23412D',
    fontSize: 16,
    fontWeight: '600',
  },
  roleList: {
    gap: 14,
    marginBottom: 18,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D6E0D5',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  cardPressed: {
    borderColor: '#2E7042',
    opacity: 0.84,
  },
  roleTitle: {
    color: '#23412D',
    fontSize: 19,
    fontWeight: '700',
  },
  roleHint: {
    color: '#2E7042',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
});
