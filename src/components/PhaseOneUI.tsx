import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenLayout({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function BrandMark() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandMark}>
        <View style={styles.brandLeaf} />
      </View>
      <Text style={styles.brandName}>FarmPrism</Text>
    </View>
  );
}

export function ScreenIntro({ eyebrow, title, description }: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.intro}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{label}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.textButton}>
      <Text style={styles.textButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#829087"
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function InlineMessage({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) {
  return <Text style={tone === 'error' ? styles.error : styles.info}>{children}</Text>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F4',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 48,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#DCE9D4',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  brandLeaf: {
    backgroundColor: '#2E7042',
    borderBottomLeftRadius: 14,
    borderTopRightRadius: 14,
    height: 20,
    transform: [{ rotate: '-28deg' }],
    width: 13,
  },
  brandName: {
    color: '#23412D',
    fontSize: 25,
    fontWeight: '700',
  },
  intro: {
    marginBottom: 28,
  },
  eyebrow: {
    color: '#2E7042',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: '#23412D',
    fontSize: 31,
    fontWeight: '700',
    lineHeight: 38,
  },
  description: {
    color: '#53645A',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2E7042',
    borderRadius: 8,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#B8C9B8',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#23412D',
    fontSize: 16,
    fontWeight: '700',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  textButtonText: {
    color: '#2E7042',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.55,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: '#23412D',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#B8C9B8',
    borderRadius: 8,
    borderWidth: 1,
    color: '#203328',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  error: {
    color: '#A33A32',
    fontSize: 14,
    lineHeight: 20,
  },
  info: {
    color: '#53645A',
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    backgroundColor: '#D6E0D5',
    height: 1,
    marginVertical: 8,
  },
});
