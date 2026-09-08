import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { demoService } from '../services/demo/demo.service';
import type { DemoNotification } from '../services/demo/demo.types';

export function NotificationsScreen() {
  const { demoAccount } = useAuth();
  const phone = demoAccount?.phone;
  const [items, setItems] = useState<DemoNotification[]>([]);
  const [loading, setLoading] = useState(Boolean(phone));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    if (!phone) return;
    const id = ++version.current;
    setLoading(true); setError(null);
    try {
      const data = await demoService.notifications(phone);
      if (id === version.current) setItems(data);
    } catch (e) { if (id === version.current) setError(e instanceof Error ? e.message : 'Unable to load notifications.'); }
    finally { if (id === version.current) setLoading(false); }
  }, [phone]);
  useFocusEffect(useCallback(() => { void refresh(); return () => { version.current++; }; }, [refresh]));
  const open = async (item: DemoNotification) => {
    if (!phone || pending) return;
    const id = version.current;
    setPending(item.id);
    try {
      await demoService.markNotificationRead(phone, item.id);
      if (id !== version.current) return;
      setItems(current => current.map(n => n.id === item.id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n));
      const target = item.type === 'new_bid' ? 'Sell > Buyer Offers' : item.entityType || 'Notification details';
      Alert.alert('Coming Soon', `${target}${item.data.crop ? ` — ${item.data.crop}` : ''} will be available soon.`);
    } catch (e) { Alert.alert('Please retry', e instanceof Error ? e.message : 'Unable to mark this notification read.'); }
    finally { setPending(null); }
  };
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={s.root}>
    {error && <View accessibilityRole="alert" style={s.message}><Text>{error}</Text><Pressable accessibilityRole="button" onPress={() => void refresh()} style={s.retry}><Text>Retry</Text></Pressable></View>}
    {loading && items.length === 0 ? <ActivityIndicator accessibilityLabel="Loading notifications" size="large" color="#12642D" style={s.message} /> :
      <FlatList data={items} keyExtractor={item => item.id} contentContainerStyle={s.list}
        refreshing={loading} onRefresh={() => void refresh()}
        ListEmptyComponent={!error ? <Text style={s.empty}>No notifications yet.</Text> : null}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}, ${item.readAt ? 'Read' : 'Unread'}`}
          disabled={pending !== null} onPress={() => void open(item)} style={[s.card, !item.readAt && s.unread]}>
          <View style={s.row}><Text style={s.title}>{item.title}</Text><Text style={s.status}>{pending === item.id ? 'Saving…' : item.readAt ? 'Read' : 'Unread'}</Text></View>
          <Text style={s.body}>{item.body}</Text><Text style={s.date}>{new Date(item.createdAt).toLocaleString()}</Text>
        </Pressable>} />}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFAF2' }, list: { padding: 16, gap: 12 },
  card: { padding: 16, gap: 10, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0EADB' },
  unread: { backgroundColor: '#EFF8E9', borderColor: '#91B784' }, row: { flexDirection: 'row', gap: 12 },
  title: { flex: 1, color: '#123B4C', fontWeight: '700', fontSize: 17 }, status: { color: '#12642D', fontSize: 12 },
  body: { color: '#315162', fontSize: 15 }, date: { color: '#68776A', fontSize: 12 },
  message: { padding: 24, gap: 12 }, retry: { minHeight: 44, justifyContent: 'center' }, empty: { color: '#315162', padding: 24, textAlign: 'center' },
});
