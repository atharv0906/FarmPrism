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
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { useRole } from '../hooks/useRole';
import type { FarmerStackParamList } from '../navigation/FarmerNavigator';

const DESIGN_W = 853;
const DESIGN_H = 1844;

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
  brown: '#25170F',
};

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

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
  photoUri: string;
};

const initialDraft: FarmerDraft = {
  fullName: '',
  farmerId: '',
  mobileNumber: '',
  state: '',
  district: '',
  taluka: '',
  village: '',
  farmSize: '',
  crops: [],
  photoUri: '',
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
  const update = (value: Partial<FarmerDraft>) =>
    setDraft((current) => ({ ...current, ...value }));

  return (
    <DraftContext.Provider value={{ draft, update }}>
      {children}
    </DraftContext.Provider>
  );
}

const useDraft = () => useContext(DraftContext);

const locations: Record<string, Record<string, Record<string, string[]>>> = {
  Maharashtra: {
    Pune: {
      Haveli: ['Wagholi', 'Kharadi', 'Manjri'],
      Mulshi: ['Pirangut', 'Paud', 'Bhugaon'],
      Baramati: ['Malegaon', 'Morgaon', 'Supe'],
    },
    Nashik: {
      Nashik: ['Makhmalabad', 'Deolali', 'Adgaon'],
      Niphad: ['Pimpalgaon', 'Lasalgaon', 'Naitale'],
    },
    Nagpur: {
      Nagpur: ['Besa', 'Beltarodi', 'Gumgaon'],
      Katol: ['Yenwa', 'Metpanjra', 'Dorli'],
    },
  },
  Karnataka: {
    Bengaluru: {
      Anekal: ['Attibele', 'Jigani', 'Chandapura'],
      Devanahalli: ['Vijayapura', 'Avathi', 'Kundana'],
    },
    Belagavi: {
      Gokak: ['Konnur', 'Mamdadapur', 'Shindholli'],
      Hukkeri: ['Sankeshwar', 'Yamakanmardi', 'Hidkal'],
    },
  },
  'Madhya Pradesh': {
    Indore: {
      Depalpur: ['Betma', 'Gautampura', 'Hatod'],
      Mhow: ['Simrol', 'Manpur', 'Kodariya'],
    },
    Bhopal: {
      Berasia: ['Tarawali', 'Eentkhedi', 'Gunga'],
      Huzur: ['Phanda', 'Ratibad', 'Bhauri'],
    },
  },
};

const cropOptions = ['Onion', 'Tomato', 'Potato'];

type Frame = [number, number, number, number];

function frame([left, top, width, height]: Frame) {
  return { position: 'absolute' as const, left, top, width, height };
}

function FitCanvas({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 18);
  const availableHeight = Math.max(1, height - safeBottom);
  const scale = Math.min(width / DESIGN_W, availableHeight / DESIGN_H);
  const scaledW = DESIGN_W * scale;
  const scaledH = DESIGN_H * scale;
  const offsetX = (DESIGN_W - scaledW) / 2;
  const offsetY = (DESIGN_H - scaledH) / 2;

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          minHeight: availableHeight,
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingBottom: safeBottom,
        }}
      >
        <View style={{ width: scaledW, height: scaledH, overflow: 'hidden' }}>
          <View
            style={{
              position: 'absolute',
              left: -offsetX,
              top: -offsetY,
              width: DESIGN_W,
              height: DESIGN_H,
              transform: [{ scale }],
            }}
          >
            {children}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Background({ submitted = false }: { submitted?: boolean }) {
  return (
    <>
      <View style={styles.designBackground} />

      {!submitted && (
        <Image
          source={A.landscape}
          resizeMode="cover"
          fadeDuration={0}
          pointerEvents="none"
          style={frame([0, 150, DESIGN_W, 370])}
        />
      )}

      {!submitted && <View style={styles.whiteProfilePanel} />}

      <Image
        source={A.topLeft}
        resizeMode="contain"
        fadeDuration={0}
        pointerEvents="none"
        style={frame([-16, -20, 205, 205])}
      />
      <Image
        source={A.topRight}
        resizeMode="contain"
        fadeDuration={0}
        pointerEvents="none"
        style={frame([664, -20, 205, 205])}
      />
    </>
  );
}

function Header({
  step,
  review = false,
  onBack,
}: {
  step: 1 | 2 | 3;
  review?: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={15}
        onPress={onBack}
        style={frame([44, 105, 78, 70])}
      >
        <Text style={styles.topBack}>←</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Help"
        onPress={() =>
          Alert.alert(
            'Help',
            review
              ? 'Review your details and use Edit if you need to change anything.'
              : 'Complete the required fields to continue.',
          )
        }
        style={[frame([682, 108, 125, 55]), styles.helpButton]}
      >
        <Text style={styles.helpText}>Help</Text>
        <View style={styles.helpCircle}>
          <Text style={styles.helpQuestion}>?</Text>
        </View>
      </Pressable>

      <Image
        source={A.logo}
        resizeMode="contain"
        fadeDuration={0}
        style={frame([294, 36, 265, 265])}
      />

      <Text style={[frame([100, 305, 653, 68]), styles.pageTitle]}>
        {review ? (
          <>
            <Text style={styles.navy}>Review Your </Text>
            <Text style={styles.green}>Details</Text>
          </>
        ) : (
          <>
            <Text style={styles.brown}>Create Your </Text>
            <Text style={styles.green}>Profile</Text>
          </>
        )}
      </Text>

      <Text style={[frame([135, 375, 583, 42]), styles.pageSubtitle]}>
        {review
          ? 'Please review your information before submitting.'
          : 'Let’s set up your farmer profile.'}
      </Text>

      <Progress step={step} />
    </>
  );
}

function Progress({ step }: { step: 1 | 2 | 3 }) {
  const centers = [182, 426, 670];
  const labels = ['Personal', 'Farm Details', 'Review'];

  return (
    <>
      <View style={[frame([182, 480, 488, 3]), styles.progressLine]} />
      <View
        style={[
          frame([182, 480, step === 1 ? 0 : step === 2 ? 244 : 488, 3]),
          styles.progressLineActive,
        ]}
      />

      {centers.map((cx, index) => {
        const number = index + 1;
        const complete = number < step;
        const active = number <= step;

        return (
          <View key={number} style={frame([cx - 35, 445, 70, 100])}>
            <View
              style={[
                styles.stepCircle,
                active ? styles.stepCircleOn : styles.stepCircleOff,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  active && styles.stepNumberOn,
                ]}
              >
                {complete ? '✓' : number}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.stepLabel,
                active && styles.stepLabelOn,
                { width: 150, marginLeft: -40 },
              ]}
            >
              {labels[index]}
            </Text>
          </View>
        );
      })}
    </>
  );
}

function Label({
  text,
  required,
  optional,
  style,
}: {
  text: string;
  required?: boolean;
  optional?: boolean;
  style: any;
}) {
  return (
    <Text style={[style, styles.label]}>
      {text}
      {required ? <Text style={styles.star}> *</Text> : null}
      {optional ? <Text style={styles.optional}> (optional)</Text> : null}
    </Text>
  );
}

function InputBox({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  icon,
  box,
  inputStyle,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'phone-pad';
  maxLength?: number;
  icon?: string;
  box: Frame;
  inputStyle?: any;
}) {
  return (
    <View style={[frame(box), styles.inputBox]}>
      {!!icon && <Text style={styles.inputIcon}>{icon}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#81909D"
        keyboardType={keyboardType}
        maxLength={maxLength}
        underlineColorAndroid="transparent"
        style={[styles.inputText, inputStyle]}
      />
    </View>
  );
}

function PickerBox({
  value,
  placeholder,
  icon,
  box,
  disabled,
  onPress,
}: {
  value: string;
  placeholder: string;
  icon: string;
  box: Frame;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        frame(box),
        styles.inputBox,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.inputIcon}>{icon}</Text>
      <Text
        numberOfLines={1}
        style={[styles.pickerText, !value && styles.placeholder]}
      >
        {value || placeholder}
      </Text>
      <Text style={styles.chevron}>⌄</Text>
    </Pressable>
  );
}

function PrimaryButton({
  label,
  box,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  box: Frame;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        frame(box),
        styles.primaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text style={styles.primaryText}>{label}</Text>
          <Text style={styles.primaryArrow}>→</Text>
        </>
      )}
    </Pressable>
  );
}

function SecondaryButton({ box, onPress }: { box: Frame; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      style={({ pressed }) => [frame(box), styles.secondaryButton, pressed && styles.pressed]}
    >
      <Text style={styles.secondaryArrow}>←</Text>
      <Text style={styles.secondaryText}>Back</Text>
    </Pressable>
  );
}

function Footer({ submitted = false }: { submitted?: boolean }) {
  if (submitted) {
    return (
      <>
        <Image
          source={A.divider}
          resizeMode="contain"
          fadeDuration={0}
          pointerEvents="none"
          style={frame([315, 1270, 225, 55])}
        />
        <Text style={[frame([240, 1310, 375, 100]), styles.submittedQuote]}>
          Together{`\n`}for a Better Tomorrow
        </Text>
        <Image
          source={A.submittedLandscape}
          resizeMode="cover"
          fadeDuration={0}
          pointerEvents="none"
          style={frame([0, 1380, 853, 464])}
        />
      </>
    );
  }

  return (
    <>
      <Image
        source={A.divider}
        resizeMode="contain"
        fadeDuration={0}
        pointerEvents="none"
        style={frame([325, 1584, 205, 45])}
      />
      <Text style={[frame([280, 1620, 295, 58]), styles.footerQuote]}>
        “Better Farmers{`\n`}Brighter Tomorrows”
      </Text>
      <Image
        source={A.landscape}
        resizeMode="cover"
        fadeDuration={0}
        pointerEvents="none"
        style={frame([0, 1650, 853, 194])}
      />
      <Image
        source={A.bottomLeft}
        resizeMode="contain"
        fadeDuration={0}
        pointerEvents="none"
        style={frame([-18, 1625, 185, 219])}
      />
      <Image
        source={A.bottomRight}
        resizeMode="contain"
        fadeDuration={0}
        pointerEvents="none"
        style={frame([685, 1625, 185, 219])}
      />
    </>
  );
}

type PickerKind = 'state' | 'district' | 'taluka' | 'village' | 'crops' | null;

function PickerModal({
  visible,
  title,
  options,
  selected,
  multiple,
  onPick,
  onDone,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string[];
  multiple?: boolean;
  onPick: (value: string) => void;
  onDone?: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { marginBottom: Math.max(insets.bottom, 18) + 12 }]}
          onPress={() => undefined}
        >
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalList}>
            {options.map((option) => {
              const active = selected.includes(option);
              return (
                <Pressable
                  key={option}
                  onPress={() => onPick(option)}
                  style={[styles.modalOption, active && styles.modalOptionOn]}
                >
                  <Text style={[styles.modalOptionText, active && styles.modalOptionTextOn]}>
                    {option}
                  </Text>
                  {active && <Text style={styles.modalCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            {multiple && (
              <Pressable onPress={onDone} style={styles.modalDone}>
                <Text style={styles.modalDoneText}>Done</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PhotoPreviewModal({
  uri,
  visible,
  onCancel,
  onDone,
}: {
  uri: string;
  visible: boolean;
  onCancel: () => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View style={styles.photoEditor}>
        <View style={[styles.photoEditorTop, { paddingTop: Math.max(insets.top, 10) + 6 }]}>
          <Pressable onPress={onCancel} hitSlop={12} style={styles.photoEditorAction}>
            <Text style={styles.photoEditorCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.photoEditorTitle}>Profile Photo</Text>
          <Pressable onPress={onDone} hitSlop={12} style={styles.photoEditorAction}>
            <Text style={styles.photoEditorDone}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.photoPreviewArea}>
          <View style={styles.photoPreviewCircle}>
            {!!uri && (
              <Image source={{ uri }} resizeMode="cover" style={styles.photoPreviewImage} />
            )}
          </View>
          <Text style={styles.photoPreviewHint}>
            This is how your profile photo will appear.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export function FarmerPersonalScreen({
  navigation,
}: NativeStackScreenProps<FarmerStackParamList, 'Personal'>) {
  const { draft, update } = useDraft();
  const { user } = useAuth();
  const { clearSelectedRole } = useRole();
  const [message, setMessage] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState('');

  useEffect(() => {
    if (!draft.mobileNumber) {
      const phone = user?.phone?.replace(/^\+91/, '') ?? '';
      if (phone) update({ mobileNumber: phone.slice(0, 10) });
    }
  }, [draft.mobileNumber, user?.phone]);

  const next = () => {
    setMessage('');
    if (!draft.fullName.trim()) return setMessage('Enter your full name.');
    if (!/^\d{11}$/.test(draft.farmerId)) {
      return setMessage('Farmer ID must contain exactly 11 digits.');
    }
    if (!/^[6-9]\d{9}$/.test(draft.mobileNumber)) {
      return setMessage('Enter a valid 10-digit mobile number.');
    }
    navigation.navigate('FarmDetails');
  };

  const chooseFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPendingPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPendingPhoto(result.assets[0].uri);
    }
  };

  const addPhoto = () => {
    Alert.alert('Add Photo', 'Choose a photo source.', [
      { text: 'Take Photo', onPress: () => void takePhoto() },
      { text: 'Choose from Gallery', onPress: () => void chooseFromGallery() },
      ...(draft.photoUri
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: () => update({ photoUri: '' }),
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const changeRole = () =>
    Alert.alert('Change role?', 'Your current farmer form will stay in this session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Change Role', onPress: clearSelectedRole },
    ]);

  return (
    <FitCanvas>
      <Background />
      <Header step={1} onBack={changeRole} />

      <View style={[frame([60, 585, 733, 650]), styles.card]}>
        <Image source={A.person} resizeMode="contain" fadeDuration={0} style={frame([24, 30, 92, 92])} />
        <Text style={[frame([125, 38, 330, 45]), styles.sectionTitle]}>Personal Details</Text>
        <Text style={[frame([125, 84, 360, 35]), styles.sectionSubtitle]}>Tell us a bit about yourself.</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add profile photo"
          onPress={addPhoto}
          style={frame([515, 16, 170, 155])}
        >
          <Image
            source={draft.photoUri ? { uri: draft.photoUri } : A.photo}
            resizeMode={draft.photoUri ? 'cover' : 'contain'}
            fadeDuration={0}
            style={[styles.photoAsset, draft.photoUri && styles.photoChosen]}
          />
        </Pressable>

        <Label text="Full Name" required style={frame([24, 178, 300, 28])} />
        <InputBox
          value={draft.fullName}
          onChangeText={(fullName) => {
            update({ fullName });
            setMessage('');
          }}
          placeholder="Enter your full name"
          icon="♙"
          box={[24, 215, 685, 75]}
        />

        <Label text="Farmer ID (11 digits)" required style={frame([24, 326, 355, 28])} />
        <InputBox
          value={draft.farmerId}
          onChangeText={(value) => {
            update({ farmerId: value.replace(/\D/g, '').slice(0, 11) });
            setMessage('');
          }}
          placeholder="Enter 11 digit Farmer ID"
          keyboardType="number-pad"
          maxLength={11}
          icon="ID"
          box={[24, 363, 366, 75]}
        />
        <Image source={A.farmerIdInfo} resizeMode="contain" fadeDuration={0} style={frame([404, 340, 282, 120])} />

        <Label text="Mobile Number" required style={frame([24, 485, 320, 28])} />
        <View style={[frame([24, 522, 685, 80]), styles.inputBox]}>
          <Text style={styles.flag}>🇮🇳</Text>
          <Text style={styles.code}>+91</Text>
          <Text style={styles.chevron}>⌄</Text>
          <View style={styles.phoneDivider} />
          <Text style={styles.phoneGlyph}>☎</Text>
          <TextInput
            value={draft.mobileNumber}
            onChangeText={(value) => {
              update({ mobileNumber: value.replace(/\D/g, '').slice(0, 10) });
              setMessage('');
            }}
            placeholder="Enter your mobile number"
            placeholderTextColor="#81909D"
            keyboardType="phone-pad"
            maxLength={10}
            underlineColorAndroid="transparent"
            style={styles.mobileTextInput}
          />
        </View>

        {!!message && <Text style={[frame([24, 610, 685, 28]), styles.errorText]}>{message}</Text>}
      </View>

      <View style={[frame([60, 1255, 733, 170]), styles.infoCard]}>
        <Image source={A.shield} resizeMode="contain" fadeDuration={0} style={frame([28, 30, 96, 105])} />
        <Text style={[frame([145, 32, 470, 35]), styles.infoTitle]}>Your information is safe with us</Text>
        <Text style={[frame([145, 73, 485, 70]), styles.infoBody]}>
          We use your details to keep your FarmPrism profile accurate and improve your farming experience.
        </Text>
        <Image source={A.leaf} resizeMode="contain" fadeDuration={0} style={frame([620, 90, 85, 70])} />
      </View>

      <PrimaryButton label="Next" box={[60, 1447, 733, 92]} onPress={next} />
      <Footer />

      <PhotoPreviewModal
        uri={pendingPhoto}
        visible={!!pendingPhoto}
        onCancel={() => setPendingPhoto('')}
        onDone={() => {
          update({ photoUri: pendingPhoto });
          setPendingPhoto('');
        }}
      />
    </FitCanvas>
  );
}

export function FarmerDetailsScreen({
  navigation,
}: NativeStackScreenProps<FarmerStackParamList, 'FarmDetails'>) {
  const { draft, update } = useDraft();
  const [message, setMessage] = useState('');
  const [picker, setPicker] = useState<PickerKind>(null);
  const [tempCrops, setTempCrops] = useState<string[]>(draft.crops);

  const states = useMemo(() => Object.keys(locations), []);
  const districts = draft.state ? Object.keys(locations[draft.state] ?? {}) : [];
  const talukas = draft.state && draft.district
    ? Object.keys(locations[draft.state]?.[draft.district] ?? {})
    : [];
  const villages = draft.state && draft.district && draft.taluka
    ? locations[draft.state]?.[draft.district]?.[draft.taluka] ?? []
    : [];

  const pickerData = (() => {
    if (picker === 'state') return { title: 'Select State', options: states, selected: draft.state ? [draft.state] : [] };
    if (picker === 'district') return { title: 'Select District', options: districts, selected: draft.district ? [draft.district] : [] };
    if (picker === 'taluka') return { title: 'Select Taluka / Tehsil', options: talukas, selected: draft.taluka ? [draft.taluka] : [] };
    if (picker === 'village') return { title: 'Select Village', options: villages, selected: draft.village ? [draft.village] : [] };
    if (picker === 'crops') return { title: 'Select Main Crops Grown', options: cropOptions, selected: tempCrops };
    return { title: '', options: [], selected: [] as string[] };
  })();

  const pickSingle = (value: string) => {
    setMessage('');
    if (picker === 'state') update({ state: value, district: '', taluka: '', village: '' });
    if (picker === 'district') update({ district: value, taluka: '', village: '' });
    if (picker === 'taluka') update({ taluka: value, village: '' });
    if (picker === 'village') update({ village: value });
    setPicker(null);
  };

  const openCrops = () => {
    setTempCrops(draft.crops);
    setPicker('crops');
  };

  const saveCrops = () => {
    update({ crops: tempCrops });
    setMessage('');
    setPicker(null);
  };

  const next = () => {
    setMessage('');
    if ([draft.state, draft.district, draft.taluka, draft.village].some((value) => !value.trim())) {
      return setMessage('Complete all required location fields.');
    }
    if (draft.crops.length === 0) return setMessage('Select at least one main crop.');
    if (draft.farmSize && Number(draft.farmSize) <= 0) {
      return setMessage('Farm size must be greater than 0 if entered.');
    }
    navigation.navigate('Review');
  };

  return (
    <FitCanvas>
      <Background />
      <Header step={2} onBack={() => navigation.goBack()} />

      <View style={[frame([34, 570, 785, 960]), styles.card]}>
        <Image source={A.farm} resizeMode="contain" fadeDuration={0} style={frame([28, 25, 94, 94])} />
        <Text style={[frame([145, 40, 330, 45]), styles.sectionTitle]}>Farm Details</Text>
        <Text style={[frame([145, 84, 350, 35]), styles.sectionSubtitle]}>Tell us about your farm.</Text>
        <Image source={A.farmIllustration} resizeMode="contain" fadeDuration={0} style={frame([480, 20, 260, 115])} />

        <Label text="State" required style={frame([30, 175, 290, 28])} />
        <Label text="District" required style={frame([412, 175, 290, 28])} />
        <PickerBox value={draft.state} placeholder="Select state" icon="⌖" box={[30, 213, 350, 82]} onPress={() => setPicker('state')} />
        <PickerBox value={draft.district} placeholder="Select district" icon="▦" box={[412, 213, 343, 82]} disabled={!draft.state} onPress={() => setPicker('district')} />

        <Label text="Taluka / Tehsil" required style={frame([30, 350, 300, 28])} />
        <Label text="Village" required style={frame([412, 350, 290, 28])} />
        <PickerBox value={draft.taluka} placeholder="Select taluka / tehsil" icon="⌂" box={[30, 388, 350, 82]} disabled={!draft.district} onPress={() => setPicker('taluka')} />
        <PickerBox value={draft.village} placeholder="Select village" icon="⌂" box={[412, 388, 343, 82]} disabled={!draft.taluka} onPress={() => setPicker('village')} />

        <Label text="Farm Size (in acres)" optional style={frame([30, 525, 340, 28])} />
        <Label text="Main Crops Grown" required style={frame([412, 525, 325, 28])} />
        <InputBox
          value={draft.farmSize}
          onChangeText={(value) => {
            update({ farmSize: value.replace(/[^0-9.]/g, '').slice(0, 8) });
            setMessage('');
          }}
          placeholder="Enter farm size"
          keyboardType="decimal-pad"
          maxLength={8}
          icon="⌁"
          box={[30, 563, 350, 82]}
        />
        <PickerBox value={draft.crops.join(', ')} placeholder="Select crops" icon="⌁" box={[412, 563, 343, 82]} onPress={openCrops} />

        <View style={[frame([30, 700, 725, 150]), styles.infoCard]}>
          <Image source={A.importance} resizeMode="contain" fadeDuration={0} style={frame([25, 25, 95, 95])} />
          <Text style={[frame([145, 28, 470, 34]), styles.infoTitle]}>Why is this important?</Text>
          <Text style={[frame([145, 70, 470, 65]), styles.infoBody]}>
            This information helps FarmPrism organize your profile, crops and future market activity.
          </Text>
          <Image source={A.leaf} resizeMode="contain" fadeDuration={0} style={frame([620, 80, 75, 60])} />
        </View>

        {!!message && <Text style={[frame([40, 858, 705, 28]), styles.errorText]}>{message}</Text>}

        <SecondaryButton box={[30, 874, 350, 72]} onPress={() => navigation.goBack()} />
        <PrimaryButton label="Next" box={[412, 874, 343, 72]} onPress={next} />
      </View>

      <Footer />

      <PickerModal
        visible={picker !== null}
        title={pickerData.title}
        options={pickerData.options}
        selected={pickerData.selected}
        multiple={picker === 'crops'}
        onPick={(value) => {
          if (picker === 'crops') {
            setTempCrops((current) =>
              current.includes(value)
                ? current.filter((crop) => crop !== value)
                : [...current, value],
            );
          } else {
            pickSingle(value);
          }
        }}
        onDone={saveCrops}
        onClose={() => setPicker(null)}
      />
    </FitCanvas>
  );
}

function ReviewSection({
  box,
  icon,
  title,
  rows,
  onEdit,
}: {
  box: Frame;
  icon: number;
  title: string;
  rows: Array<{ label: string; value: string }>;
  onEdit: () => void;
}) {
  return (
    <View style={[frame(box), styles.reviewCard]}>
      <Image source={icon} resizeMode="contain" fadeDuration={0} style={frame([22, 20, 82, 82])} />
      <Text style={[frame([128, 28, 400, 45]), styles.reviewTitle]}>{title}</Text>
      <Pressable onPress={onEdit} style={[frame([625, 25, 110, 48]), styles.editButton]}>
        <Text style={styles.editPen}>✎</Text>
        <Text style={styles.editText}>Edit</Text>
      </Pressable>

      <View style={frame([128, 98, 580, box[3] - 115])}>
        {rows.map((row, index) => (
          <View key={row.label} style={[styles.reviewRow, { top: index * 47 }]}>
            <Text style={styles.reviewLabel}>{row.label}</Text>
            <Text style={styles.reviewValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function FarmerReviewScreen({
  navigation,
}: NativeStackScreenProps<FarmerStackParamList, 'Review'>) {
  const { draft } = useDraft();
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    if (submitting) return;
    setSubmitting(true);
    requestAnimationFrame(() => navigation.replace('Submitted'));
  };

  return (
    <FitCanvas>
      <Background />
      <Header step={3} review onBack={() => navigation.goBack()} />

      <ReviewSection
        box={[48, 540, 757, 250]}
        icon={A.person}
        title="Personal Details"
        onEdit={() => navigation.navigate('Personal')}
        rows={[
          { label: 'Full Name', value: draft.fullName },
          { label: 'Farmer ID', value: draft.farmerId },
          { label: 'Mobile Number', value: draft.mobileNumber ? `+91 ${draft.mobileNumber}` : '' },
        ]}
      />

      <ReviewSection
        box={[48, 810, 757, 395]}
        icon={A.farm}
        title="Farm Details"
        onEdit={() => navigation.navigate('FarmDetails')}
        rows={[
          { label: 'State', value: draft.state },
          { label: 'District', value: draft.district },
          { label: 'Taluka / Tehsil', value: draft.taluka },
          { label: 'Village', value: draft.village },
          { label: 'Farm Size (in acres)', value: draft.farmSize ? `${draft.farmSize} Acres` : '' },
          { label: 'Main Crops Grown', value: draft.crops.join(', ') },
        ]}
      />

      <View style={[frame([48, 1225, 757, 175]), styles.infoCard]}>
        <Image source={A.shield} resizeMode="contain" fadeDuration={0} style={frame([30, 33, 100, 105])} />
        <Text style={[frame([155, 35, 470, 35]), styles.infoTitle]}>Your details are ready</Text>
        <Text style={[frame([155, 78, 485, 65]), styles.infoBody]}>
          Please check your information carefully before submitting.
        </Text>
        <Image source={A.leaf} resizeMode="contain" fadeDuration={0} style={frame([650, 90, 75, 60])} />
      </View>

      <PrimaryButton label="Submit" box={[48, 1415, 757, 78]} onPress={submit} loading={submitting} disabled={submitting} />
      <SecondaryButton box={[48, 1510, 757, 70]} onPress={() => navigation.goBack()} />
      <Footer />
    </FitCanvas>
  );
}

export function ProfileSubmittedScreen({
  navigation,
}: NativeStackScreenProps<FarmerStackParamList, 'Submitted'>) {
  return (
    <FitCanvas>
      <Background submitted />

      <Image source={A.logo} resizeMode="contain" fadeDuration={0} style={frame([288, 55, 277, 277])} />
      <Image source={A.successLeaves} resizeMode="contain" fadeDuration={0} style={frame([210, 330, 430, 300])} />
      <Image source={A.successCheck} resizeMode="contain" fadeDuration={0} style={frame([298, 345, 255, 255])} />

      <Text style={[frame([80, 650, 693, 78]), styles.submittedTitle]}>
        <Text style={styles.navy}>Profile </Text>
        <Text style={styles.green}>Submitted!</Text>
      </Text>
      <Text style={[frame([120, 755, 613, 55]), styles.submittedSubtitle]}>
        Your profile is generated successfully.
      </Text>

      <View style={[frame([55, 900, 743, 210]), styles.infoCard]}>
        <View style={[frame([34, 55, 90, 90]), styles.clockCircle]}>
          <Text style={styles.clockText}>◷</Text>
        </View>
        <Text style={[frame([155, 45, 520, 40]), styles.infoTitle]}>You can go to the dashboard</Text>
        <Text style={[frame([155, 95, 520, 80]), styles.infoBody]}>
          Continue to your dashboard to manage your crops, listings and FarmPrism activities.
        </Text>
      </View>

      <PrimaryButton label="Go to Dashboard" box={[60, 1140, 733, 92]} onPress={() => navigation.replace('Dashboard')} />
      <Footer submitted />
    </FitCanvas>
  );
}

export function FarmerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { clearSelectedRole } = useRole();

  return (
    <View
      style={[
        styles.dashboard,
        {
          paddingTop: Math.max(insets.top, 18) + 18,
          paddingBottom: Math.max(insets.bottom, 18) + 18,
        },
      ]}
    >
      <Image source={A.logo} resizeMode="contain" fadeDuration={0} style={styles.dashboardLogo} />
      <Text style={styles.dashboardTitle}>Farmer Dashboard</Text>
      <Text style={styles.dashboardBody}>
        Your profile setup is complete. The full Farmer Dashboard UI is the next phase.
      </Text>
      <Pressable onPress={clearSelectedRole} style={styles.changeRole}>
        <Text style={styles.changeRoleText}>← Change Role</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  designBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: C.cream },
  whiteProfilePanel: {
    position: 'absolute',
    left: 28,
    top: 165,
    width: 797,
    height: 1415,
    backgroundColor: '#FFFEF8',
    borderTopLeftRadius: 390,
    borderTopRightRadius: 390,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  helpButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  helpText: { color: C.greenDark, fontSize: 27, fontWeight: '700' },
  helpCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  helpQuestion: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  topBack: { color: C.green, fontSize: 62, lineHeight: 65, fontWeight: '400' },
  pageTitle: { textAlign: 'center', fontFamily: serif, fontSize: 52, lineHeight: 62, fontWeight: '700', includeFontPadding: false },
  pageSubtitle: { color: C.muted, fontSize: 27, lineHeight: 36, textAlign: 'center', includeFontPadding: false },
  navy: { color: C.navy },
  green: { color: C.greenDark },
  brown: { color: C.brown },
  progressLine: { backgroundColor: '#DADFDA' },
  progressLineActive: { backgroundColor: C.green },
  stepCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  stepCircleOn: { backgroundColor: C.green },
  stepCircleOff: { backgroundColor: '#E8EBE8' },
  stepNumber: { color: '#425769', fontSize: 29, fontWeight: '700' },
  stepNumberOn: { color: '#FFFFFF' },
  stepLabel: { marginTop: 7, color: '#5E6D7B', fontSize: 20, textAlign: 'center' },
  stepLabelOn: { color: C.greenDark, fontWeight: '700' },
  card: { backgroundColor: C.white, borderRadius: 24, borderWidth: 1, borderColor: '#E1E5DA', shadowColor: '#304D2C', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sectionTitle: { color: C.navy, fontFamily: serif, fontSize: 31, lineHeight: 40, fontWeight: '700', includeFontPadding: false },
  sectionSubtitle: { color: C.muted, fontSize: 22, lineHeight: 29, includeFontPadding: false },
  photoAsset: { width: '100%', height: '100%' },
  photoChosen: { borderRadius: 78, borderWidth: 3, borderColor: '#D9E6CF' },
  label: { color: '#10283A', fontSize: 23, lineHeight: 28, fontWeight: '700', includeFontPadding: false },
  star: { color: '#E52323' },
  optional: { color: '#7A8878', fontSize: 18, fontWeight: '500' },
  inputBox: { borderWidth: 1, borderColor: '#CCD4DA', borderRadius: 14, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  inputIcon: { minWidth: 44, marginRight: 10, color: '#536A7C', fontSize: 24, fontWeight: '600', textAlign: 'center' },
  inputText: { flex: 1, height: '100%', paddingVertical: 0, color: C.navy, fontSize: 22 },
  pickerText: { flex: 1, color: C.navy, fontSize: 22 },
  placeholder: { color: '#81909D' },
  chevron: { marginLeft: 10, color: C.navy, fontSize: 25 },
  disabled: { opacity: 0.48, backgroundColor: '#F4F6F3' },
  pressed: { opacity: 0.78 },
  flag: { fontSize: 32 },
  code: { marginLeft: 10, color: C.navy, fontSize: 27, fontWeight: '700' },
  phoneDivider: { width: 1, height: 48, marginHorizontal: 18, backgroundColor: '#D6DDDF' },
  phoneGlyph: { marginRight: 18, color: '#536A7C', fontSize: 28 },
  mobileTextInput: { flex: 1, height: '100%', paddingVertical: 0, color: C.navy, fontSize: 22 },
  errorText: { color: C.danger, fontSize: 18, textAlign: 'center' },
  infoCard: { backgroundColor: C.pale, borderRadius: 18, borderWidth: 1, borderColor: C.paleBorder, overflow: 'hidden' },
  infoTitle: { color: C.greenDark, fontSize: 24, lineHeight: 31, fontWeight: '700', includeFontPadding: false },
  infoBody: { color: '#314A5A', fontSize: 20, lineHeight: 29, includeFontPadding: false },
  primaryButton: { backgroundColor: C.green, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#27482C', shadowOpacity: 0.16, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  buttonDisabled: { opacity: 0.55 },
  primaryText: { color: '#FFFFFF', fontSize: 31, fontWeight: '600' },
  primaryArrow: { marginLeft: 28, color: '#FFFFFF', fontSize: 47, fontWeight: '300' },
  secondaryButton: { borderRadius: 16, borderWidth: 2, borderColor: C.green, backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secondaryArrow: { marginRight: 18, color: C.green, fontSize: 40 },
  secondaryText: { color: C.green, fontSize: 29, fontWeight: '700' },
  footerQuote: { color: '#5F381D', textAlign: 'center', fontFamily: serif, fontSize: 21, lineHeight: 24 },
  submittedQuote: { color: '#4B6C28', textAlign: 'center', fontFamily: serif, fontStyle: 'italic', fontSize: 31, lineHeight: 38 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(12,28,19,.38)', justifyContent: 'flex-end' },
  modalCard: { marginHorizontal: 16, maxHeight: '70%', borderRadius: 24, backgroundColor: '#FFFFFF', padding: 20 },
  modalTitle: { color: C.navy, fontSize: 21, fontWeight: '700' },
  modalList: { marginTop: 14 },
  modalOption: { minHeight: 52, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D9DEDC', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalOptionOn: { backgroundColor: '#EEF7E9' },
  modalOptionText: { color: '#324B5B', fontSize: 16 },
  modalOptionTextOn: { color: C.greenDark, fontWeight: '700' },
  modalCheck: { color: C.green, fontSize: 20, fontWeight: '700' },
  modalActions: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { minWidth: 90, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { color: C.green, fontWeight: '700' },
  modalDone: { minWidth: 90, minHeight: 46, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  modalDoneText: { color: '#FFFFFF', fontWeight: '700' },
  reviewCard: { backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: '#E1E6D8', shadowColor: '#304D2C', shadowOpacity: 0.07, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  reviewTitle: { color: C.navy, fontFamily: serif, fontSize: 30, lineHeight: 38, fontWeight: '700', includeFontPadding: false },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  editPen: { color: C.green, fontSize: 29 },
  editText: { color: C.green, fontSize: 24, fontWeight: '700' },
  reviewRow: { position: 'absolute', left: 0, right: 0, height: 40, flexDirection: 'row', alignItems: 'flex-start' },
  reviewLabel: { width: '47%', color: '#526676', fontSize: 21, lineHeight: 28 },
  reviewValue: { flex: 1, color: '#111A22', fontSize: 21, lineHeight: 28, fontWeight: '500' },
  submittedTitle: { textAlign: 'center', fontFamily: serif, fontSize: 59, lineHeight: 70, fontWeight: '700' },
  submittedSubtitle: { textAlign: 'center', color: C.muted, fontSize: 29, lineHeight: 38 },
  clockCircle: { borderRadius: 45, backgroundColor: '#E4EFCB', alignItems: 'center', justifyContent: 'center' },
  clockText: { color: C.greenDark, fontSize: 52, fontWeight: '700' },
  photoEditor: { flex: 1, backgroundColor: '#111111' },
  photoEditorTop: { minHeight: 76, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333333' },
  photoEditorAction: { minWidth: 72, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  photoEditorCancel: { color: '#FFFFFF', fontSize: 16 },
  photoEditorTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  photoEditorDone: { color: '#5FD36E', fontSize: 17, fontWeight: '800' },
  photoPreviewArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  photoPreviewCircle: { width: 290, height: 290, borderRadius: 145, overflow: 'hidden', borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#222222' },
  photoPreviewImage: { width: '100%', height: '100%' },
  photoPreviewHint: { marginTop: 24, color: '#D8D8D8', fontSize: 15, textAlign: 'center' },
  dashboard: { flex: 1, paddingHorizontal: 28, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
  dashboardLogo: { width: 140, height: 140 },
  dashboardTitle: { marginTop: 18, color: C.greenDark, fontFamily: serif, fontSize: 31, fontWeight: '700' },
  dashboardBody: { marginTop: 12, color: C.muted, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  changeRole: { marginTop: 30, minHeight: 54, paddingHorizontal: 22, borderRadius: 14, borderWidth: 1, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  changeRoleText: { color: C.green, fontSize: 16, fontWeight: '700' },
});
