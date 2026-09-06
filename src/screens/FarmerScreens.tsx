import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import type { FarmerStackParamList } from '../navigation/FarmerNavigator';

const C = {
  cream: '#FBF9EE',
  white: '#FFFEF8',
  green: '#176D31',
  greenDark: '#0D5528',
  navy: '#142D42',
  muted: '#58697A',
  border: '#D9DFD5',
  pale: '#F2F6E5',
  paleBorder: '#DDE5C8',
  danger: '#B3261E',
};

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const A = {
  logo: require('../../assets/6. FarmPrism_Role_Page_Assets/role_farmprism_logo.png'),
  topLeft: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_top_left_leaves.png'),
  topRight: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_top_right_leaves.png'),
  landscape: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_bottom_landscape.png'),
  bottomLeft: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_bottom_left_leaves.png'),
  bottomRight: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_bottom_right_leaves.png'),
  divider: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_divider_sprout.png'),
  person: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_person_icon.png'),
  farm: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_farm_icon.png'),
  photo: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_photo_placeholder.png'),
  farmerIdInfo: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_farmer_id_info.png'),
  shield: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_security_shield.png'),
  leaf: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_security_leaf.png'),
  farmIllustration: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_farm_illustration.png'),
  importance: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_importance_icon.png'),
  successCheck: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_success_check.png'),
  successLeaves: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_success_leaves.png'),
  submittedLandscape: require('../../assets/7. FarmPrism_Farmer_Profile_Assets/farmer_profile_submitted_landscape.png'),
};

type FarmerDraft = {
  fullName: string;
  farmerId: string;
  mobileNumber: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  farmSize: string;
  crops: string[];
};

const initialDraft: FarmerDraft = {
  fullName: '', farmerId: '', mobileNumber: '', state: '', district: '',
  taluka: '', village: '', farmSize: '', crops: [],
};

type DraftContextValue = {
  draft: FarmerDraft;
  update: (value: Partial<FarmerDraft>) => void;
};

const DraftContext = createContext<DraftContextValue>({
  draft: initialDraft,
  update: () => undefined,
});

export function FarmerDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState(initialDraft);
  const update = (value: Partial<FarmerDraft>) => setDraft((old) => ({ ...old, ...value }));
  return <DraftContext.Provider value={{ draft, update }}>{children}</DraftContext.Provider>;
}

const useDraft = () => useContext(DraftContext);

const locations: Record<string, Record<string, Record<string, string[]>>> = {
  Maharashtra: {
    Pune: { Haveli: ['Wagholi', 'Kharadi', 'Manjri'], Mulshi: ['Pirangut', 'Paud', 'Bhugaon'], Baramati: ['Malegaon', 'Morgaon', 'Supe'] },
    Nashik: { Nashik: ['Makhmalabad', 'Deolali', 'Adgaon'], Niphad: ['Pimpalgaon', 'Lasalgaon', 'Naitale'] },
    Nagpur: { Nagpur: ['Besa', 'Beltarodi', 'Gumgaon'], Katol: ['Yenwa', 'Metpanjra', 'Dorli'] },
  },
  Karnataka: {
    Bengaluru: { Anekal: ['Attibele', 'Jigani', 'Chandapura'], Devanahalli: ['Vijayapura', 'Avathi', 'Kundana'] },
    Belagavi: { Gokak: ['Konnur', 'Mamdadapur', 'Shindholli'], Hukkeri: ['Sankeshwar', 'Yamakanmardi', 'Hidkal'] },
  },
  'Madhya Pradesh': {
    Indore: { Depalpur: ['Betma', 'Gautampura', 'Hatod'], Mhow: ['Simrol', 'Manpur', 'Kodariya'] },
    Bhopal: { Berasia: ['Tarawali', 'Eentkhedi', 'Gunga'], Huzur: ['Phanda', 'Ratibad', 'Bhauri'] },
  },
};

const cropOptions = ['Tomato', 'Onion', 'Wheat', 'Soybean', 'Paddy (Rice)', 'Sugarcane', 'Cotton', 'Maize'];

function TopLeaves() {
  return <>
    <Image source={A.topLeft} resizeMode="contain" fadeDuration={0} pointerEvents="none" style={s.topLeft} />
    <Image source={A.topRight} resizeMode="contain" fadeDuration={0} pointerEvents="none" style={s.topRight} />
  </>;
}

function Screen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 20);
  return (
    <View style={s.root}>
      <StatusBar hidden />
      <TopLeaves />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: Math.max(insets.top, 8), paddingBottom: safeBottom + 24 }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Progress({ step }: { step: 1 | 2 | 3 }) {
  const items = ['Personal', 'Farm Details', 'Review'];
  return (
    <View style={s.progress}>
      <View style={s.line} />
      <View style={[s.lineActive, { width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }]} />
      <View style={s.progressRow}>
        {items.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n <= step;
          return <View key={label} style={s.stepItem}>
            <View style={[s.stepCircle, active ? s.stepOn : s.stepOff]}>
              <Text style={[s.stepNumber, active && s.stepNumberOn]}>{done ? '✓' : n}</Text>
            </View>
            <Text style={[s.stepLabel, active && s.stepLabelOn]}>{label}</Text>
          </View>;
        })}
      </View>
    </View>
  );
}

function Header({ step, review = false, onBack }: { step: 1 | 2 | 3; review?: boolean; onBack: () => void }) {
  return (
    <View style={s.header}>
      <View style={s.headerButtons}>
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={s.backArrow}>←</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Help"
          onPress={() => Alert.alert('Help', review ? 'Review your details and use Edit if you need to change anything.' : 'Complete the required fields to continue.')}
          style={s.help}
        >
          <Text style={s.helpText}>Help</Text><View style={s.helpQ}><Text style={s.helpQText}>?</Text></View>
        </Pressable>
      </View>
      <Image source={A.logo} resizeMode="contain" fadeDuration={0} style={s.logo} />
      <Text style={s.title}>
        {review ? <><Text style={s.navy}>Review Your </Text><Text style={s.green}>Details</Text></> : <><Text style={s.brown}>Create Your </Text><Text style={s.green}>Profile</Text></>}
      </Text>
      <Text style={s.subtitle}>{review ? 'Please review your information before submitting.' : 'Let’s set up your farmer profile.'}</Text>
      <Progress step={step} />
    </View>
  );
}

function SectionTitle({ icon, title, subtitle, right }: { icon: number; title: string; subtitle?: string; right?: ReactNode }) {
  return <View style={s.sectionTitleRow}>
    <Image source={icon} resizeMode="contain" fadeDuration={0} style={s.sectionIcon} />
    <View style={s.sectionText}><Text style={s.sectionTitle}>{title}</Text>{subtitle ? <Text style={s.sectionSub}>{subtitle}</Text> : null}</View>
    {right}
  </View>;
}

function Label({ children, required, optional }: { children: ReactNode; required?: boolean; optional?: boolean }) {
  return <Text style={s.label}>{children}{required ? <Text style={s.star}> *</Text> : null}{optional ? <Text style={s.optional}> (optional)</Text> : null}</Text>;
}

function Input({ value, onChangeText, placeholder, icon, keyboardType = 'default', maxLength }: {
  value: string; onChangeText: (v: string) => void; placeholder: string; icon?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'phone-pad'; maxLength?: number;
}) {
  return <View style={s.inputShell}>
    {icon ? <Text style={s.inputIcon}>{icon}</Text> : null}
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#81909D" keyboardType={keyboardType} maxLength={maxLength} underlineColorAndroid="transparent" style={s.input} />
  </View>;
}

function MobileInput({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return <View style={s.inputShell}>
    <View style={s.phonePrefix}><Text style={s.flag}>🇮🇳</Text><Text style={s.code}>+91</Text><Text style={s.chev}>⌄</Text></View>
    <View style={s.vline} /><Text style={s.inputIcon}>☎</Text>
    <TextInput value={value} onChangeText={(v) => onChangeText(v.replace(/\D/g, '').slice(0, 10))} placeholder="Enter your mobile number" placeholderTextColor="#81909D" keyboardType="phone-pad" maxLength={10} underlineColorAndroid="transparent" style={s.input} />
  </View>;
}

function PickerField({ value, placeholder, icon, disabled, onPress }: { value: string; placeholder: string; icon: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [s.inputShell, disabled && s.disabled, pressed && !disabled && s.pressed]}>
    <Text style={s.inputIcon}>{icon}</Text><Text numberOfLines={1} style={[s.pickerText, !value && s.placeholder]}>{value || placeholder}</Text><Text style={s.chev}>⌄</Text>
  </Pressable>;
}

function Info({ icon, title, body }: { icon: number; title: string; body: string }) {
  return <View style={s.info}>
    <Image source={icon} resizeMode="contain" fadeDuration={0} style={s.infoIcon} />
    <View style={s.infoCopy}><Text style={s.infoTitle}>{title}</Text><Text style={s.infoBody}>{body}</Text></View>
    <Image source={A.leaf} resizeMode="contain" fadeDuration={0} pointerEvents="none" style={s.infoLeaf} />
  </View>;
}

function Primary({ label, onPress, disabled, loading }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [s.primary, disabled && s.primaryDisabled, pressed && !disabled && s.pressed]}>
    {loading ? <ActivityIndicator color="#fff" /> : <><Text style={s.primaryText}>{label}</Text><Text style={s.primaryArrow}>→</Text></>}
  </Pressable>;
}

function Secondary({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [s.secondary, pressed && s.pressed]}><Text style={s.secondaryArrow}>←</Text><Text style={s.secondaryText}>{label}</Text></Pressable>;
}

function Footer({ submitted = false }: { submitted?: boolean }) {
  return <View style={s.footer}>
    <Image source={A.divider} resizeMode="contain" fadeDuration={0} style={s.footerDivider} />
    <Text style={submitted ? s.quoteSubmitted : s.quote}>{submitted ? 'Together\nfor a Better Tomorrow' : '“Better Farmers\nBrighter Tomorrows”'}</Text>
    <View style={s.landscapeWrap}>
      <Image source={submitted ? A.submittedLandscape : A.landscape} resizeMode="cover" fadeDuration={0} style={s.landscape} />
      {!submitted ? <><Image source={A.bottomLeft} resizeMode="contain" fadeDuration={0} style={s.bottomLeft} /><Image source={A.bottomRight} resizeMode="contain" fadeDuration={0} style={s.bottomRight} /></> : null}
    </View>
  </View>;
}

type PickerKind = 'state' | 'district' | 'taluka' | 'village' | 'crops' | null;

function PickerModal({ visible, title, options, selected, multiple, onPick, onDone, onClose }: {
  visible: boolean; title: string; options: string[]; selected: string[]; multiple?: boolean;
  onPick: (v: string) => void; onDone?: () => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={s.modalBack} onPress={onClose}>
      <Pressable style={[s.modal, { marginBottom: Math.max(insets.bottom, 18) + 12 }]} onPress={() => undefined}>
        <Text style={s.modalTitle}>{title}</Text>
        <ScrollView style={s.modalList}>
          {options.map((o) => {
            const active = selected.includes(o);
            return <Pressable key={o} onPress={() => onPick(o)} style={[s.option, active && s.optionOn]}><Text style={[s.optionText, active && s.optionTextOn]}>{o}</Text>{active ? <Text style={s.check}>✓</Text> : null}</Pressable>;
          })}
          {!options.length ? <Text style={s.empty}>Select the previous location first.</Text> : null}
        </ScrollView>
        <View style={s.modalActions}><Pressable onPress={onClose} style={s.cancel}><Text style={s.cancelText}>Cancel</Text></Pressable>{multiple ? <Pressable onPress={onDone} style={s.done}><Text style={s.doneText}>Done</Text></Pressable> : null}</View>
      </Pressable>
    </Pressable>
  </Modal>;
}

export function FarmerPersonalScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'Personal'>) {
  const { draft, update } = useDraft();
  const { user } = useAuth();
  const { clearSelectedRole } = useRole();
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!draft.mobileNumber) {
      const phone = user?.phone?.replace(/^\+91/, '') ?? '';
      if (phone) update({ mobileNumber: phone.slice(0, 10) });
    }
  }, [draft.mobileNumber, user?.phone]);

  const next = () => {
    setMsg('');
    if (!draft.fullName.trim()) return setMsg('Enter your full name.');
    if (!/^\d{11}$/.test(draft.farmerId)) return setMsg('Farmer ID must contain exactly 11 digits.');
    if (!/^[6-9]\d{9}$/.test(draft.mobileNumber)) return setMsg('Enter a valid 10-digit mobile number.');
    navigation.navigate('FarmDetails');
  };

  const changeRole = () => Alert.alert('Change role?', 'Your current farmer form will stay in this session.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Change Role', onPress: clearSelectedRole },
  ]);

  return <Screen>
    <Header step={1} onBack={changeRole} />
    <View style={s.card}>
      <SectionTitle icon={A.person} title="Personal Details" subtitle="Tell us a bit about yourself." right={
        <Pressable onPress={() => Alert.alert('Add Photo', 'Profile photo upload will be connected when media storage is enabled.')}><Image source={A.photo} resizeMode="contain" fadeDuration={0} style={s.photo} /></Pressable>
      } />
      <View style={s.field}><Label required>Full Name</Label><Input value={draft.fullName} onChangeText={(fullName) => { update({ fullName }); setMsg(''); }} placeholder="Enter your full name" icon="♙" /></View>
      <View style={s.field}><Label required>Farmer ID (11 digits)</Label><View style={s.idRow}><View style={s.idInput}><Input value={draft.farmerId} onChangeText={(v) => { update({ farmerId: v.replace(/\D/g, '').slice(0, 11) }); setMsg(''); }} placeholder="Enter 11 digit Farmer ID" keyboardType="number-pad" maxLength={11} icon="ID" /></View><Image source={A.farmerIdInfo} resizeMode="contain" fadeDuration={0} style={s.idInfo} /></View></View>
      <View style={s.field}><Label required>Mobile Number</Label><MobileInput value={draft.mobileNumber} onChangeText={(mobileNumber) => { update({ mobileNumber }); setMsg(''); }} /></View>
      {msg ? <Text style={s.error}>{msg}</Text> : null}
    </View>
    <Info icon={A.shield} title="Your information is safe with us" body="We use your details only to support your FarmPrism profile and farming experience." />
    <View style={s.oneAction}><Primary label="Next" onPress={next} /></View>
    <Footer />
  </Screen>;
}

export function FarmerDetailsScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'FarmDetails'>) {
  const { draft, update } = useDraft();
  const [msg, setMsg] = useState('');
  const [picker, setPicker] = useState<PickerKind>(null);
  const [tempCrops, setTempCrops] = useState<string[]>(draft.crops);

  const states = useMemo(() => Object.keys(locations), []);
  const districts = draft.state ? Object.keys(locations[draft.state] ?? {}) : [];
  const talukas = draft.state && draft.district ? Object.keys(locations[draft.state]?.[draft.district] ?? {}) : [];
  const villages = draft.state && draft.district && draft.taluka ? locations[draft.state]?.[draft.district]?.[draft.taluka] ?? [] : [];

  const config = (() => {
    if (picker === 'state') return { title: 'Select State', options: states, selected: draft.state ? [draft.state] : [] };
    if (picker === 'district') return { title: 'Select District', options: districts, selected: draft.district ? [draft.district] : [] };
    if (picker === 'taluka') return { title: 'Select Taluka / Tehsil', options: talukas, selected: draft.taluka ? [draft.taluka] : [] };
    if (picker === 'village') return { title: 'Select Village', options: villages, selected: draft.village ? [draft.village] : [] };
    if (picker === 'crops') return { title: 'Select Main Crops Grown', options: cropOptions, selected: tempCrops };
    return { title: '', options: [], selected: [] as string[] };
  })();

  const pickSingle = (v: string) => {
    setMsg('');
    if (picker === 'state') update({ state: v, district: '', taluka: '', village: '' });
    if (picker === 'district') update({ district: v, taluka: '', village: '' });
    if (picker === 'taluka') update({ taluka: v, village: '' });
    if (picker === 'village') update({ village: v });
    setPicker(null);
  };

  const next = () => {
    setMsg('');
    if ([draft.state, draft.district, draft.taluka, draft.village].some((v) => !v.trim())) return setMsg('Complete all required location fields.');
    if (!draft.crops.length) return setMsg('Select at least one main crop.');
    if (draft.farmSize && Number(draft.farmSize) <= 0) return setMsg('Farm size must be greater than 0 if entered.');
    navigation.navigate('Review');
  };

  return <Screen>
    <Header step={2} onBack={() => navigation.goBack()} />
    <View style={s.card}>
      <SectionTitle icon={A.farm} title="Farm Details" subtitle="Tell us about your farm." right={<Image source={A.farmIllustration} resizeMode="contain" fadeDuration={0} style={s.farmIllustration} />} />
      <View style={s.grid}>
        <View style={s.half}><Label required>State</Label><PickerField value={draft.state} placeholder="Select state" icon="⌖" onPress={() => setPicker('state')} /></View>
        <View style={s.half}><Label required>District</Label><PickerField value={draft.district} placeholder="Select district" icon="▦" disabled={!draft.state} onPress={() => setPicker('district')} /></View>
        <View style={s.half}><Label required>Taluka / Tehsil</Label><PickerField value={draft.taluka} placeholder="Select taluka / tehsil" icon="⌂" disabled={!draft.district} onPress={() => setPicker('taluka')} /></View>
        <View style={s.half}><Label required>Village</Label><PickerField value={draft.village} placeholder="Select village" icon="⌂" disabled={!draft.taluka} onPress={() => setPicker('village')} /></View>
        <View style={s.half}><Label optional>Farm Size (in acres)</Label><Input value={draft.farmSize} onChangeText={(farmSize) => { const x = farmSize.replace(/[^0-9.]/g, ''); const parts = x.split('.'); update({ farmSize: parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}` : parts[0] }); setMsg(''); }} placeholder="Enter farm size" keyboardType="decimal-pad" maxLength={8} icon="⌁" /></View>
        <View style={s.half}><Label required>Main Crops Grown</Label><PickerField value={draft.crops.join(', ')} placeholder="Select crops" icon="⌁" onPress={() => { setTempCrops(draft.crops); setPicker('crops'); }} /></View>
      </View>
      {msg ? <Text style={s.error}>{msg}</Text> : null}
    </View>
    <Info icon={A.importance} title="Why is this important?" body="This information helps FarmPrism organize your profile, crops and future market activity." />
    <View style={s.twoActions}><View style={s.action}><Secondary label="Back" onPress={() => navigation.goBack()} /></View><View style={s.action}><Primary label="Next" onPress={next} /></View></View>
    <Footer />
    <PickerModal visible={picker !== null} title={config.title} options={config.options} selected={config.selected} multiple={picker === 'crops'} onPick={(v) => picker === 'crops' ? setTempCrops((old) => old.includes(v) ? old.filter((x) => x !== v) : [...old, v]) : pickSingle(v)} onDone={() => { update({ crops: tempCrops }); setMsg(''); setPicker(null); }} onClose={() => setPicker(null)} />
  </Screen>;
}

function ReviewCard({ icon, title, rows, onEdit }: { icon: number; title: string; rows: { label: string; value: string }[]; onEdit: () => void }) {
  return <View style={s.reviewCard}>
    <View style={s.reviewHead}><Image source={icon} resizeMode="contain" fadeDuration={0} style={s.reviewIcon} /><Text style={s.reviewTitle}>{title}</Text><Pressable onPress={onEdit} style={s.edit}><Text style={s.editPen}>✎</Text><Text style={s.editText}>Edit</Text></Pressable></View>
    <View style={s.reviewRows}>{rows.map((r) => <View key={r.label} style={s.reviewRow}><Text style={s.reviewLabel}>{r.label}</Text><Text style={s.reviewValue}>{r.value}</Text></View>)}</View>
  </View>;
}

export function FarmerReviewScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'Review'>) {
  const { draft } = useDraft();
  const [submitting, setSubmitting] = useState(false);
  const submit = () => { if (submitting) return; setSubmitting(true); requestAnimationFrame(() => navigation.replace('Submitted')); };
  return <Screen>
    <Header step={3} review onBack={() => navigation.goBack()} />
    <ReviewCard icon={A.person} title="Personal Details" onEdit={() => navigation.navigate('Personal')} rows={[
      { label: 'Full Name', value: draft.fullName }, { label: 'Farmer ID', value: draft.farmerId }, { label: 'Mobile Number', value: draft.mobileNumber ? `+91 ${draft.mobileNumber}` : '' },
    ]} />
    <ReviewCard icon={A.farm} title="Farm Details" onEdit={() => navigation.navigate('FarmDetails')} rows={[
      { label: 'State', value: draft.state }, { label: 'District', value: draft.district }, { label: 'Taluka / Tehsil', value: draft.taluka }, { label: 'Village', value: draft.village }, { label: 'Farm Size (in acres)', value: draft.farmSize ? `${draft.farmSize} Acres` : '' }, { label: 'Main Crops Grown', value: draft.crops.join(', ') },
    ]} />
    <Info icon={A.shield} title="Your details are ready" body="Please check your information carefully before submitting." />
    <View style={s.oneAction}><Primary label="Submit" onPress={submit} disabled={submitting} loading={submitting} /></View>
    <View style={s.oneAction2}><Secondary label="Back" onPress={() => navigation.goBack()} /></View>
    <Footer />
  </Screen>;
}

export function ProfileSubmittedScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'Submitted'>) {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 20);
  return <View style={s.root}>
    <StatusBar hidden /><TopLeaves />
    <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={[s.submittedContent, { paddingTop: Math.max(insets.top, 10) + 24, paddingBottom: safeBottom + 24 }]}>
      <Image source={A.logo} resizeMode="contain" fadeDuration={0} style={s.submittedLogo} />
      <View style={s.successWrap}><Image source={A.successLeaves} resizeMode="contain" fadeDuration={0} style={s.successLeaves} /><Image source={A.successCheck} resizeMode="contain" fadeDuration={0} style={s.successCheck} /></View>
      <Text style={s.submittedTitle}><Text style={s.navy}>Profile </Text><Text style={s.green}>Submitted!</Text></Text>
      <Text style={s.submittedSub}>Your profile is generated successfully.</Text>
      <View style={s.dashboardCard}><View style={s.clock}><Text style={s.clockText}>◷</Text></View><View style={s.dashboardCopy}><Text style={s.dashboardCardTitle}>You can go to the dashboard</Text><Text style={s.dashboardCardBody}>Continue to your dashboard to manage your crops, listings and FarmPrism activities.</Text></View></View>
      <View style={s.dashboardButton}><Primary label="Go to Dashboard" onPress={() => navigation.replace('Dashboard')} /></View>
      <Footer submitted />
    </ScrollView>
  </View>;
}

export function FarmerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { clearSelectedRole } = useRole();
  return <View style={[s.dashboardRoot, { paddingTop: Math.max(insets.top, 20) + 20, paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
    <Image source={A.logo} resizeMode="contain" fadeDuration={0} style={s.dashboardLogo} />
    <Text style={s.dashboardTitle}>Farmer Dashboard</Text>
    <Text style={s.dashboardSub}>Your farmer profile setup is complete. The full farmer dashboard UI is the next phase.</Text>
    <Pressable onPress={clearSelectedRole} style={s.changeRole}><Text style={s.changeRoleText}>← Change Role</Text></Pressable>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream }, flex: { flex: 1 },
  topLeft: { position: 'absolute', left: -18, top: -22, width: 132, height: 132, zIndex: 3 },
  topRight: { position: 'absolute', right: -18, top: -22, width: 132, height: 132, zIndex: 3 },
  header: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 6 },
  headerButtons: { position: 'absolute', left: 30, right: 30, top: 24, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backArrow: { color: C.green, fontSize: 40, lineHeight: 44 },
  help: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }, helpText: { color: C.greenDark, fontSize: 18, fontWeight: '700' }, helpQ: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }, helpQText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  logo: { width: 150, height: 150 }, title: { marginTop: -4, textAlign: 'center', fontFamily: serif, fontSize: 32, lineHeight: 40, fontWeight: '700' }, navy: { color: '#0E273B' }, green: { color: C.greenDark }, brown: { color: '#24160F' }, subtitle: { marginTop: 4, color: C.muted, fontSize: 17, textAlign: 'center' },
  progress: { width: '78%', marginTop: 22, marginBottom: 18, position: 'relative' }, line: { position: 'absolute', top: 22, left: '16.5%', right: '16.5%', height: 2, backgroundColor: '#D9DEDA' }, lineActive: { position: 'absolute', top: 22, left: '16.5%', maxWidth: '67%', height: 2, backgroundColor: C.green }, progressRow: { flexDirection: 'row', justifyContent: 'space-between' }, stepItem: { width: '33%', alignItems: 'center' }, stepCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, stepOn: { backgroundColor: C.green }, stepOff: { backgroundColor: '#E8EBE8' }, stepNumber: { color: '#475D6D', fontSize: 20, fontWeight: '700' }, stepNumberOn: { color: '#fff' }, stepLabel: { marginTop: 7, color: '#5E6D7B', fontSize: 14, textAlign: 'center' }, stepLabelOn: { color: C.greenDark, fontWeight: '700' },
  card: { marginHorizontal: 28, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22, borderRadius: 24, backgroundColor: C.white, borderWidth: 1, borderColor: '#E2E5DB', shadowColor: '#38512E', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sectionTitleRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center' }, sectionIcon: { width: 70, height: 70, marginRight: 14 }, sectionText: { flex: 1 }, sectionTitle: { color: C.navy, fontFamily: serif, fontSize: 24, fontWeight: '700' }, sectionSub: { marginTop: 3, color: C.muted, fontSize: 15 }, photo: { width: 118, height: 118 }, farmIllustration: { width: 150, height: 88, marginLeft: 8 },
  field: { marginTop: 18 }, label: { marginBottom: 9, color: '#10283A', fontSize: 16, fontWeight: '700' }, star: { color: '#E52323' }, optional: { color: '#758574', fontWeight: '500', fontSize: 13 }, inputShell: { minHeight: 58, borderWidth: 1, borderColor: '#D3D9DD', borderRadius: 13, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }, inputIcon: { minWidth: 29, marginRight: 9, color: '#536A7C', fontSize: 17, fontWeight: '600', textAlign: 'center' }, input: { flex: 1, height: 56, paddingVertical: 0, color: C.navy, fontSize: 16 }, idRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, idInput: { flex: 1 }, idInfo: { width: 132, height: 82 }, phonePrefix: { height: 56, flexDirection: 'row', alignItems: 'center', paddingRight: 10 }, flag: { fontSize: 22 }, code: { marginLeft: 8, color: C.navy, fontSize: 18, fontWeight: '700' }, chev: { marginLeft: 6, color: C.navy, fontSize: 18 }, vline: { width: 1, height: 38, backgroundColor: '#D8DDDF', marginRight: 10 },
  error: { marginTop: 14, color: C.danger, fontSize: 13, textAlign: 'center' },
  info: { marginHorizontal: 30, marginTop: 20, minHeight: 126, paddingHorizontal: 20, paddingVertical: 18, borderRadius: 18, borderWidth: 1, borderColor: C.paleBorder, backgroundColor: C.pale, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }, infoIcon: { width: 72, height: 72, marginRight: 18 }, infoCopy: { flex: 1, paddingRight: 38 }, infoTitle: { color: C.greenDark, fontSize: 17, fontWeight: '700', lineHeight: 23 }, infoBody: { marginTop: 5, color: '#314A5A', fontSize: 14, lineHeight: 21 }, infoLeaf: { position: 'absolute', right: 9, bottom: 8, width: 58, height: 58 },
  oneAction: { marginHorizontal: 30, marginTop: 20 }, oneAction2: { marginHorizontal: 30, marginTop: 12 }, primary: { minHeight: 62, borderRadius: 16, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: '#27482C', shadowOpacity: 0.16, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 3 }, primaryDisabled: { opacity: 0.55 }, primaryText: { color: '#fff', fontSize: 21, fontWeight: '600' }, primaryArrow: { marginLeft: 22, color: '#fff', fontSize: 35 }, pressed: { opacity: 0.78 }, secondary: { minHeight: 62, borderRadius: 16, borderWidth: 2, borderColor: C.green, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, secondaryArrow: { marginRight: 14, color: C.green, fontSize: 32 }, secondaryText: { color: C.green, fontSize: 20, fontWeight: '700' },
  footer: { marginTop: 18 }, footerDivider: { alignSelf: 'center', width: 150, height: 36 }, quote: { marginTop: -4, color: '#5F381D', textAlign: 'center', fontFamily: serif, fontSize: 15, lineHeight: 18 }, quoteSubmitted: { color: '#4B6C28', textAlign: 'center', fontFamily: serif, fontStyle: 'italic', fontSize: 25, lineHeight: 31 }, landscapeWrap: { height: 230, marginTop: 4, overflow: 'hidden' }, landscape: { width: '100%', height: 250 }, bottomLeft: { position: 'absolute', left: -18, bottom: -15, width: 150, height: 150 }, bottomRight: { position: 'absolute', right: -18, bottom: -15, width: 150, height: 150 },
  grid: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18 }, half: { width: '48.3%' }, pickerText: { flex: 1, color: C.navy, fontSize: 14 }, placeholder: { color: '#81909D' }, disabled: { opacity: 0.5, backgroundColor: '#F5F6F4' }, twoActions: { marginHorizontal: 30, marginTop: 20, flexDirection: 'row', gap: 12 }, action: { flex: 1 },
  modalBack: { flex: 1, backgroundColor: 'rgba(12,28,19,.38)', justifyContent: 'flex-end' }, modal: { marginHorizontal: 16, maxHeight: '70%', borderRadius: 24, backgroundColor: '#fff', padding: 20 }, modalTitle: { color: C.navy, fontSize: 21, fontWeight: '700' }, modalList: { marginTop: 14 }, option: { minHeight: 52, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D9DEDC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, optionOn: { backgroundColor: '#EEF7E9' }, optionText: { color: '#324B5B', fontSize: 16 }, optionTextOn: { color: C.greenDark, fontWeight: '700' }, check: { color: C.green, fontSize: 20, fontWeight: '700' }, empty: { paddingVertical: 24, color: C.muted, textAlign: 'center' }, modalActions: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }, cancel: { minWidth: 90, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: C.green, fontWeight: '700' }, done: { minWidth: 90, minHeight: 46, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }, doneText: { color: '#fff', fontWeight: '700' },
  reviewCard: { marginHorizontal: 24, marginBottom: 14, paddingHorizontal: 20, paddingVertical: 18, borderRadius: 20, borderWidth: 1, borderColor: '#E1E6D8', backgroundColor: C.white, shadowColor: '#304D2C', shadowOpacity: 0.07, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 }, reviewHead: { flexDirection: 'row', alignItems: 'center' }, reviewIcon: { width: 62, height: 62, marginRight: 14 }, reviewTitle: { flex: 1, color: C.navy, fontFamily: serif, fontSize: 23, fontWeight: '700' }, edit: { minHeight: 42, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 7 }, editPen: { color: C.green, fontSize: 24 }, editText: { color: C.green, fontSize: 17, fontWeight: '700' }, reviewRows: { marginTop: 12, paddingLeft: 76 }, reviewRow: { minHeight: 32, flexDirection: 'row', alignItems: 'flex-start' }, reviewLabel: { width: '48%', color: '#526676', fontSize: 15, lineHeight: 21 }, reviewValue: { flex: 1, color: '#111A22', fontSize: 15, lineHeight: 21, fontWeight: '500' },
  submittedContent: { minHeight: '100%', alignItems: 'center' }, submittedLogo: { width: 170, height: 170 }, successWrap: { width: 260, height: 240, marginTop: 18, alignItems: 'center', justifyContent: 'center' }, successLeaves: { position: 'absolute', width: 260, height: 190, bottom: 8 }, successCheck: { width: 180, height: 180 }, submittedTitle: { marginTop: 12, fontFamily: serif, fontSize: 38, fontWeight: '700', textAlign: 'center' }, submittedSub: { marginTop: 14, paddingHorizontal: 28, color: C.muted, fontSize: 18, textAlign: 'center' }, dashboardCard: { width: '86%', marginTop: 54, minHeight: 150, padding: 22, borderRadius: 18, borderWidth: 1, borderColor: C.paleBorder, backgroundColor: C.pale, flexDirection: 'row', alignItems: 'center' }, clock: { width: 76, height: 76, borderRadius: 38, marginRight: 18, backgroundColor: '#E4EFCB', alignItems: 'center', justifyContent: 'center' }, clockText: { color: C.greenDark, fontSize: 42, fontWeight: '700' }, dashboardCopy: { flex: 1 }, dashboardCardTitle: { color: C.greenDark, fontSize: 19, fontWeight: '700', lineHeight: 25 }, dashboardCardBody: { marginTop: 7, color: '#566779', fontSize: 15, lineHeight: 22 }, dashboardButton: { width: '86%', marginTop: 24 },
  dashboardRoot: { flex: 1, paddingHorizontal: 28, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' }, dashboardLogo: { width: 140, height: 140 }, dashboardTitle: { marginTop: 18, color: C.greenDark, fontFamily: serif, fontSize: 31, fontWeight: '700' }, dashboardSub: { marginTop: 12, color: C.muted, fontSize: 16, lineHeight: 23, textAlign: 'center' }, changeRole: { marginTop: 30, minHeight: 54, paddingHorizontal: 22, borderRadius: 14, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center' }, changeRoleText: { color: C.green, fontSize: 16, fontWeight: '700' },
});
