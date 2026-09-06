import { createContext, useContext, useState } from 'react';
import { Alert, type AlertButton, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import type { FarmerStackParamList } from '../navigation/FarmerNavigator';

interface FarmerDraft {
  fullName: string;
  farmerId: string;
  mobileNumber: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  crops: string;
}

const initialDraft: FarmerDraft = {
  fullName: '',
  farmerId: '',
  mobileNumber: '',
  state: '',
  district: '',
  taluka: '',
  village: '',
  crops: '',
};

const DraftContext = createContext<{ draft: FarmerDraft; update: (v: Partial<FarmerDraft>) => void }>({
  draft: initialDraft,
  update: () => undefined,
});

export function FarmerDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  return <DraftContext.Provider value={{ draft, update: v => setDraft(x => ({ ...x, ...v })) }}>{children}</DraftContext.Provider>;
}

const useDraft = () => useContext(DraftContext);

function Canvas({ children }: { children: React.ReactNode }) {
  return <View style={styles.canvas}><StatusBar hidden />{children}</View>;
}

export function FarmerPersonalScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'Personal'>) {
  const { draft, update } = useDraft();
  const { user } = useAuth();
  const { clearSelectedRole } = useRole();
  const [msg, setMsg] = useState('');

  const next = () => {
    if (!draft.fullName.trim() || !/^[0-9]{11}$/.test(draft.farmerId)) {
      setMsg('Enter your full name and an 11-digit Farmer ID.');
      return;
    }
    navigation.navigate('FarmDetails');
  };

  return (
    <Canvas>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose a different role"
        style={styles.back}
        onPress={clearSelectedRole}
      >
        <Text style={styles.backText}>← Change Role</Text>
      </Pressable>     <Pressable style={styles.help} onPress={() => Alert.alert('Help', 'Enter your personal details exactly as shown on your official farmer record.')} />
      <TextInput value={draft.fullName} onChangeText={v => update({ fullName: v })} placeholder="" style={[styles.pInput, styles.name]} />
      <TextInput value={draft.farmerId} onChangeText={v => update({ farmerId: v.replace(/\D/g, '').slice(0, 11) })} keyboardType="number-pad" placeholder="" style={[styles.pInput, styles.farmerId]} />
      <TextInput value={draft.mobileNumber || user?.phone?.replace('+91', '') || ''} onChangeText={v => update({ mobileNumber: v.replace(/\D/g, '').slice(0, 10) })} keyboardType="phone-pad" placeholder="" style={[styles.pInput, styles.mobile]} />
      {msg && <Text style={styles.overlayMsg}>{msg}</Text>}
      <Pressable style={styles.next1} onPress={next} />
    </Canvas>
  );
}

function choose(label: string, options: string[], onSelect: (v: string) => void) {
  const buttons: AlertButton[] = [...options.map(value => ({ text: value, onPress: () => onSelect(value) })), { text: 'Cancel', style: 'cancel' }];
  Alert.alert(label, undefined, buttons);
}

export function FarmerDetailsScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'FarmDetails'>) {
  const { draft, update } = useDraft();
  const [msg, setMsg] = useState('');
  const required = [draft.state, draft.district, draft.taluka, draft.village, draft.crops];

  const next = () => {
    if (required.some(v => !v.trim())) {
      setMsg('Complete all farm details to continue.');
      return;
    }
    navigation.navigate('Review');
  };

  return (
    <Canvas>
      <Pressable style={styles.back} onPress={() => navigation.goBack()} />
      <Pressable style={styles.help} onPress={() => Alert.alert('Help', 'Select your location and main crops grown.')} />
      <Pressable style={[styles.selectHit, styles.state]} onPress={() => choose('State', ['Maharashtra', 'Karnataka', 'Madhya Pradesh'], v => update({ state: v }))} />
      <Pressable style={[styles.selectHit, styles.district]} onPress={() => choose('District', ['Pune', 'Nashik', 'Nagpur'], v => update({ district: v }))} />
      <Pressable style={[styles.selectHit, styles.taluka]} onPress={() => choose('Taluka / Tehsil', ['Haveli', 'Mulshi', 'Baramati'], v => update({ taluka: v }))} />
      <Pressable style={[styles.selectHit, styles.village]} onPress={() => choose('Village', ['Wagholi', 'Kharadi', 'Manjri'], v => update({ village: v }))} />
      <Pressable style={[styles.selectHit, styles.crops]} onPress={() => choose('Main Crops Grown', ['Paddy (Rice), Tomato', 'Wheat, Onion', 'Sugarcane'], v => update({ crops: v }))} />
      {msg && <Text style={styles.overlayMsg}>{msg}</Text>}
      <Pressable style={styles.back2} onPress={() => navigation.goBack()} />
      <Pressable style={styles.next2} onPress={next} />
    </Canvas>
  );
}

export function FarmerReviewScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'Review'>) {
  const { draft } = useDraft();
  return (
    <Canvas>
      <Pressable style={styles.back} onPress={() => navigation.goBack()} />
      <Pressable style={styles.help} onPress={() => Alert.alert('Help', 'Review the information before submission.')} />
      <Text style={[styles.reviewValue, styles.rvName]}>{draft.fullName}</Text>
      <Text style={[styles.reviewValue, styles.rvFarmer]}>{draft.farmerId}</Text>
      <Text style={[styles.reviewValue, styles.rvMobile]}>{draft.mobileNumber}</Text>
      <Text style={[styles.reviewValue, styles.rvState]}>{draft.state}</Text>
      <Text style={[styles.reviewValue, styles.rvDistrict]}>{draft.district}</Text>
      <Text style={[styles.reviewValue, styles.rvTaluka]}>{draft.taluka}</Text>
      <Text style={[styles.reviewValue, styles.rvVillage]}>{draft.village}</Text>
      <Text style={[styles.reviewValue, styles.rvCrops]}>{draft.crops}</Text>
      <Pressable style={styles.editPersonal} onPress={() => navigation.navigate('Personal')} />
      <Pressable style={styles.editFarm} onPress={() => navigation.navigate('FarmDetails')} />
      <Pressable style={styles.submit} onPress={() => navigation.navigate('Submitted')} />
      <Pressable style={styles.backReview} onPress={() => navigation.goBack()} />
    </Canvas>
  );
}

export function ProfileSubmittedScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'Submitted'>) {
  const { logout } = useAuth();
  return (
    <Canvas>
      <Pressable style={styles.submittedLogin} onPress={() => void logout()} />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: '#fff' },
back: {
  position: 'absolute',
  left: '5%',
  top: '3%',
  minWidth: 120,
  height: 42,
  paddingHorizontal: 12,
  borderRadius: 12,
  backgroundColor: 'rgba(255,255,255,0.94)',
  borderWidth: 1,
  borderColor: '#1B6B35',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 20,
},

backText: {
  color: '#1B6B35',
  fontSize: 14,
  fontWeight: '700',
},  help: { position: 'absolute', right: '5%', top: '3%', width: '13%', height: '5%' },
  pInput: { position: 'absolute', left: '8%', width: '48%', height: '4.2%', backgroundColor: 'transparent', color: '#24352B', fontSize: 14 },
  name: { top: '25.0%' },
  farmerId: { top: '30.2%' },
  mobile: { top: '38.0%' },
  overlayMsg: { position: 'absolute', left: '8%', right: '8%', bottom: '11%', backgroundColor: 'rgba(255,250,240,.96)', color: '#A34238', padding: 8, borderRadius: 7, fontSize: 12 },
  next1: { position: 'absolute', left: '7%', right: '7%', bottom: '3%', height: '6%' },
  selectHit: { position: 'absolute', height: '5.3%' },
  state: { left: '7%', top: '25%', width: '40%' },
  district: { left: '52%', top: '25%', width: '40%' },
  taluka: { left: '7%', top: '31%', width: '40%' },
  village: { left: '52%', top: '31%', width: '40%' },
  crops: { left: '52%', top: '37%', width: '40%' },
  back2: { position: 'absolute', left: '7%', bottom: '3%', width: '40%', height: '6%' },
  next2: { position: 'absolute', right: '7%', bottom: '3%', width: '40%', height: '6%' },
  reviewValue: { position: 'absolute', left: '46%', right: '8%', color: '#24352B', fontSize: 12, fontWeight: '600' },
  rvName: { top: '24.8%' },
  rvFarmer: { top: '28.2%' },
  rvMobile: { top: '31.6%' },
  rvState: { top: '39.8%' },
  rvDistrict: { top: '43.0%' },
  rvTaluka: { top: '46.2%' },
  rvVillage: { top: '49.4%' },
  rvCrops: { top: '52.6%' },
  editPersonal: { position: 'absolute', right: '6%', top: '20%', width: '16%', height: '5%' },
  editFarm: { position: 'absolute', right: '6%', top: '36%', width: '16%', height: '5%' },
  submit: { position: 'absolute', left: '7%', right: '7%', bottom: '9%', height: '6%' },
  backReview: { position: 'absolute', left: '7%', right: '7%', bottom: '3%', height: '5%' },
  submittedLogin: { position: 'absolute', left: '24%', right: '24%', top: '54%', height: '6%' },
});
