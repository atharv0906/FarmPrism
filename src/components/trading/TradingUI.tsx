import type { PropsWithChildren } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const money = (value: number | null | undefined) => value == null ? 'Unavailable' : '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const date = (value: string | null | undefined) => value ? new Date(value).toLocaleString() : 'Unavailable';
export function Button({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, disabled && { opacity: 0.5 }]}><Text style={s.buttonText}>{title}</Text></Pressable>;
}
export function Card({ title, children }: PropsWithChildren<{ title?: string }>) {
  return <View style={s.card}>{title && <Text style={s.title}>{title}</Text>}{children}</View>;
}
export function Field({ label, value, onChange, numeric = false, secure = false }: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean; secure?: boolean }) {
  return <View style={{ gap: 6 }}><Text>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType={numeric ? 'decimal-pad' : 'default'} secureTextEntry={secure} style={s.input} /></View>;
}
export function Page({ title, children, loading = false, error, retry, footer }: PropsWithChildren<{ title: string; loading?: boolean; error?: string | null; retry?: () => void; footer?: React.ReactNode }>) {
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={s.root}><KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}><Text style={s.heading}>{title}</Text>
      {loading && <ActivityIndicator accessibilityLabel="Loading" color="#12642D" />}
      {error && <Card><Text accessibilityRole="alert">{error}</Text>{retry && <Button title="Retry" onPress={retry} />}</Card>}
      {children}
    </ScrollView>{footer}</KeyboardAvoidingView></SafeAreaView>;
}
export const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F4EA' }, content: { padding: 16, paddingBottom: 28, gap: 14 },
  heading: { color: '#183B2B', fontSize: 28, fontWeight: '800' }, title: { color: '#1E4631', fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: 'white', borderRadius: 18, padding: 16, gap: 10, borderWidth: 1, borderColor: '#E7E3D5' },
  button: { minHeight: 46, padding: 12, backgroundColor: '#12642D', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: 'white', fontWeight: '600' }, input: { borderWidth: 1, borderColor: '#A7BCA7', backgroundColor: 'white', borderRadius: 10, padding: 12, minHeight: 48 },
  tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 12, borderTopWidth: 1, borderColor: '#DCE5D5' },
  tab: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, tabText: { color: '#12642D', fontWeight: '600', fontSize: 12 },
});
