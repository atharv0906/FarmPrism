import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TradingRoutes } from '../../navigation/TradingRoutes';
import { useAuth } from '../../hooks/useAuth';
import { FarmerPage, ui } from '../farmer-sell/FarmerSellUI';
import { dashboardAssets as d } from '../farmer-dashboard/dashboardAssets';
import { LoadState, type LoadProps } from './LoadState';
export { Card, Field, Badge, SectionTitle, Metric, ActionTile, cropArtwork, quintals, ui } from '../farmer-sell/FarmerSellUI';
export { money, date } from '../trading/TradingUI';
export { LoadState } from './LoadState';

export function Button({ title, onPress, disabled = false, primary = false }: { title: string; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, !primary && ui.buttonOutline, disabled && ui.disabled, pressed && ui.pressed]}>
    <Text style={[ui.buttonText, !primary && ui.buttonOutlineText]}>{title}</Text>
  </Pressable>;
}
export function SelectChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected, checked: selected }} onPress={onPress}
    style={[styles.chip, selected && styles.selected]}><Text style={[ui.toggleText, selected && ui.toggleSelectedText]}>{label}</Text></Pressable>;
}
export function Page({ title, children, ...load }: PropsWithChildren<{ title: string } & LoadProps>) {
  const { demoAccount } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<TradingRoutes>>();
  if (demoAccount?.role === 'farmer') return <FarmerPage title={title} back={navigation.canGoBack()} {...load}>{children}</FarmerPage>;
  return <SafeAreaView edges={['top', 'left', 'right']} style={ui.root}><StatusBar style="dark" />
    <KeyboardAvoidingView style={ui.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.header}><View style={ui.brandRow}><Image source={d.logo} resizeMode="contain" style={ui.logo} />
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={ui.bell} onPress={() => navigation.navigate('Notifications')}><Image source={d.notification} style={ui.bellIcon} /></Pressable></View>
          <View style={ui.titleRow}>{navigation.canGoBack() && <Pressable accessibilityRole="button" accessibilityLabel="Go back" style={ui.back} onPress={() => navigation.goBack()}><Text style={ui.backText}>‹</Text></Pressable>}
            <View style={{ flex: 1, gap: 4 }}><Text style={ui.eyebrow}>{demoAccount?.role === 'logistics' ? 'DELIVERY PARTNER' : 'BUYER'}</Text><Text style={ui.pageTitle}>{title}</Text></View></View>
        </View><View style={styles.body}><LoadState {...load} />{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  header: { backgroundColor: '#EAF3E4', padding: 16, gap: 10 }, body: { padding: 12, gap: 12 },
  chip: { flexGrow: 1, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: '#B7CDC3', backgroundColor: '#FFFFFF', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: '#DDF2D6', borderColor: '#12642D', borderWidth: 2 },
});
