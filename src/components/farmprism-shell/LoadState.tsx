import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export type LoadProps = { loading?: boolean; error?: string | null; hasData?: boolean; retry?: () => void; mutationError?: string | null };
export function LoadState({ loading, error, hasData, retry, mutationError }: LoadProps) {
  return <>
    {loading && !hasData && <ActivityIndicator accessibilityLabel="Loading" color="#12642D" />}
    {error && <View style={[styles.notice, !hasData && styles.initial]}>
      <Text accessibilityRole="alert" style={styles.text}>{hasData ? "Couldn't refresh. Showing last updated data." : error}</Text>
      {retry && <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}><Text style={styles.link}>Retry</Text></Pressable>}
    </View>}
    {mutationError && <Text accessibilityRole="alert" style={styles.error}>{mutationError}</Text>}
  </>;
}
const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF3DC', borderRadius: 12, paddingHorizontal: 12 },
  initial: { padding: 20, minHeight: 100 }, text: { flex: 1, color: '#695432', fontSize: 12, lineHeight: 18 },
  retry: { minHeight: 44, justifyContent: 'center', padding: 8 }, link: { color: '#12642D', fontWeight: '700' },
  error: { color: '#9F3528', fontSize: 13, padding: 8 },
});
