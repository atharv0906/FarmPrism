import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigationProp } from '@react-navigation/native';

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

import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useRole } from '../hooks/useRole';

import type { AuthStackParamList } from '../navigation/AuthNavigator';
import type { ApplicationRole } from '../types/role';

/*
 * FarmPrism Get Started artwork.
 *
 * These are the four approved individual onboarding screens.
 * Do not replace them with the 4-in-1 collage.
 */
const getStartedSlides = [
  require('../../assets/2a_intro.png'),
  require('../../assets/2b_intro.png'),
  require('../../assets/2c_intro.png'),
  require('../../assets/2d_intro.png'),
] as const;

/*
 * Language Selection artwork.
 * Existing screen — unchanged.
 */
const languageSelectorImage = require('../../assets/1a.lang sel.png');

const languageSelectorImageStyle = {
  width: '100%',
  height: '100%',
} as const;

const languageSelectorStyles = StyleSheet.create({
  languageBackHit: {
    position: 'absolute',
    left: '6%',
    top: '74%',
    width: '34%',
    height: '6%',
  },

  languageEnglishHit: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    top: '31.5%',
    height: '10.5%',
  },

  languageHindiHit: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    top: '43.5%',
    height: '10.5%',
  },

  languageMarathiHit: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    top: '55.5%',
    height: '10.5%',
  },

  languageContinueHit: {
    position: 'absolute',
    right: '6%',
    top: '74%',
    width: '50%',
    height: '6%',
  },
});

const languageRowMaskStyles = StyleSheet.create({
  englishTop: {
    position: 'absolute',
    left: '6.5%',
    right: '6.5%',
    top: '32.2%',
    height: '0.25%',
    backgroundColor: '#F7FAF1',
  },

  englishBottom: {
    position: 'absolute',
    left: '6.5%',
    right: '6.5%',
    top: '42.0%',
    height: '0.25%',
    backgroundColor: '#F7FAF1',
  },

  englishLeft: {
    position: 'absolute',
    left: '6.5%',
    top: '32.2%',
    width: '0.25%',
    height: '10%',
    backgroundColor: '#F7FAF1',
  },

  englishRight: {
    position: 'absolute',
    right: '6.5%',
    top: '32.2%',
    width: '0.25%',
    height: '10%',
    backgroundColor: '#F7FAF1',
  },

  radioEnglish: {
    position: 'absolute',
    right: '9.5%',
    top: '35.0%',
    width: '6.5%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#F7FAF1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioHindi: {
    position: 'absolute',
    right: '9.5%',
    top: '47.0%',
    width: '6.5%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioMarathi: {
    position: 'absolute',
    right: '9.5%',
    top: '59.0%',
    width: '6.5%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedRadio: {
    borderWidth: 3,
    borderColor: '#146A34',
  },

  unselectedRadio: {
    borderWidth: 3,
    borderColor: '#8A949A',
  },

  radioDot: {
    width: '56%',
    height: '56%',
    borderRadius: 999,
    backgroundColor: '#146A34',
  },
});

const loginImage = require('../../assets/3.mainlogin.png');
const roleImage = require('../../assets/4.select role.png');

function DesignImage({
  source,
  children,
}: {
  source: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.canvas}>
      <StatusBar hidden />

      <ImageBackground
        source={source}
        resizeMode="cover"
        fadeDuration={0}
        style={styles.background}
      >
        {children}
      </ImageBackground>
    </View>
  );
}

function BackButton({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
      onPress={onPress}
      style={styles.backButton}
    >
      <Text style={styles.backButtonLabel}>‹</Text>
    </Pressable>
  );
}

/*
 * ============================================================
 * GET STARTED
 * ============================================================
 *
 * Important:
 *
 * The artwork itself already contains:
 * - FarmPrism branding
 * - page content
 * - page dots
 * - Get Started button
 * - arrow
 * - bottom white panel
 *
 * Therefore this component DOES NOT draw another visible button
 * or another visible set of dots.
 *
 * React Native only provides transparent interaction areas.
 */
export function GetStartedScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'GetStarted'>) {
  const { width, height } = useWindowDimensions();

  const pagerRef = useRef<FlatList<number>>(null);

  const [page, setPage] = useState(0);

  const goToPage = (nextPage: number) => {
    const safePage = Math.max(
      0,
      Math.min(getStartedSlides.length - 1, nextPage),
    );

    setPage(safePage);

    pagerRef.current?.scrollToIndex({
      index: safePage,
      animated: true,
    });
  };

  const continueFromPage = () => {
    if (page === getStartedSlides.length - 1) {
      navigation.navigate('PhoneLogin');
      return;
    }

    goToPage(page + 1);
  };

  const handleMomentumScrollEnd = (event: any) => {
    const nextPage = Math.round(
      event.nativeEvent.contentOffset.x / width,
    );

    if (
      nextPage >= 0 &&
      nextPage < getStartedSlides.length
    ) {
      setPage(nextPage);
    }
  };

  return (
    <View style={styles.getStartedRoot}>
      <StatusBar hidden />

      <FlatList
        ref={pagerRef}
        data={getStartedSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(_, index) => `get-started-${index}`}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => (
          <View
            style={[
              styles.getStartedPage,
              {
                width,
                height,
              },
            ]}
          >
            <Image
              source={item}
              resizeMode="contain"
              style={styles.getStartedImage}
            />
          </View>
        )}
      />

      {/*
       * Transparent interaction area over the Get Started button
       * already present inside the approved artwork.
       *
       * No visible button is created here.
       */}
      <Pressable
        onPress={continueFromPage}
        accessibilityRole="button"
        accessibilityLabel="Get Started"
        style={styles.getStartedButtonHit}
      />

      {/*
       * Transparent interaction areas over the four baked-in
       * page indicators.
       *
       * No visible dots are created here.
       */}
      <View
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Get Started screen 1"
          onPress={() => goToPage(0)}
          style={styles.getStartedDotHit1}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Get Started screen 2"
          onPress={() => goToPage(1)}
          style={styles.getStartedDotHit2}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Get Started screen 3"
          onPress={() => goToPage(2)}
          style={styles.getStartedDotHit3}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go to Get Started screen 4"
          onPress={() => goToPage(3)}
          style={styles.getStartedDotHit4}
        />
      </View>
    </View>
  );
}

/*
 * ============================================================
 * LANGUAGE SELECTION
 * ============================================================
 *
 * Existing implementation — preserved.
 */
export function LanguageSelectionScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'LanguageSelection'>) {
  const {
    language,
    setLanguage,
    supportedLanguages,
  } = useLanguage();

  const saveAndContinue = async () => {
    await setLanguage(language);
    navigation.navigate('GetStarted');
  };

  return (
    <View style={styles.canvas}>
      <StatusBar hidden />

      <Image
        source={languageSelectorImage}
        resizeMode="cover"
        style={languageSelectorImageStyle}
      />

      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <View style={languageRowMaskStyles.englishTop} />

        <View style={languageRowMaskStyles.englishBottom} />

        <View style={languageRowMaskStyles.englishLeft} />

        <View style={languageRowMaskStyles.englishRight} />

        <View
          style={[
            languageRowMaskStyles.radioEnglish,
            language === 'en'
              ? languageRowMaskStyles.selectedRadio
              : languageRowMaskStyles.unselectedRadio,
          ]}
        >
          {language === 'en' && (
            <View style={languageRowMaskStyles.radioDot} />
          )}
        </View>

        <View
          style={[
            languageRowMaskStyles.radioHindi,
            language === 'hi'
              ? languageRowMaskStyles.selectedRadio
              : languageRowMaskStyles.unselectedRadio,
          ]}
        >
          {language === 'hi' && (
            <View style={languageRowMaskStyles.radioDot} />
          )}
        </View>

        <View
          style={[
            languageRowMaskStyles.radioMarathi,
            language === 'mr'
              ? languageRowMaskStyles.selectedRadio
              : languageRowMaskStyles.unselectedRadio,
          ]}
        >
          {language === 'mr' && (
            <View style={languageRowMaskStyles.radioDot} />
          )}
        </View>
      </View>

      <Pressable
        style={languageSelectorStyles.languageBackHit}
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Back"
      />

      <Pressable
        style={languageSelectorStyles.languageEnglishHit}
        onPress={() => void setLanguage('en')}
        accessibilityRole="radio"
        accessibilityState={{
          selected: language === 'en',
        }}
        accessibilityLabel="English"
      />

      <Pressable
        style={languageSelectorStyles.languageHindiHit}
        onPress={() => void setLanguage('hi')}
        accessibilityRole="radio"
        accessibilityState={{
          selected: language === 'hi',
        }}
        accessibilityLabel="Hindi"
      />

      <Pressable
        style={languageSelectorStyles.languageMarathiHit}
        onPress={() => void setLanguage('mr')}
        accessibilityRole="radio"
        accessibilityState={{
          selected: language === 'mr',
        }}
        accessibilityLabel="Marathi"
      />

      <Pressable
        style={languageSelectorStyles.languageContinueHit}
        onPress={() => void saveAndContinue()}
        accessibilityRole="button"
        accessibilityLabel="Save and Continue"
      />
    </View>
  );
}

/*
 * ============================================================
 * PHONE LOGIN
 * ============================================================
 *
 * Existing implementation — preserved.
 */
export function PhoneLoginScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>) {
  return (
    <PhoneAuthScreen
      navigation={navigation}
      mode="login"
    />
  );
}

export function SignUpScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'SignUp'>) {
  return (
    <PhoneAuthScreen
      navigation={navigation}
      mode="signup"
    />
  );
}

function PhoneAuthScreen({
  navigation,
  mode,
}: {
  navigation: NavigationProp<AuthStackParamList>;
  mode: 'login' | 'signup';
}) {
  const { requestOtp, verifyOtp } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const refs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSeconds((value) => value - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const send = async () => {
    setBusy(true);
    setMessage(null);

    try {
      const result = await requestOtp(phone);

      setPhone(result.phone.replace('+91', ''));
      setSent(true);
      setOtp('');
      setSeconds(30);

      setTimeout(() => {
        refs.current[0]?.focus();
      }, 120);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send OTP.',
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setMessage(
        'Enter the 6-digit OTP sent to your phone.',
      );
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await verifyOtp(phone, otp);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to verify OTP.',
      );
    } finally {
      setBusy(false);
    }
  };

  const updateDigit = (
    index: number,
    value: string,
  ) => {
    const digits = value.replace(/\D/g, '');

    if (digits.length > 1) {
      const sixDigits = digits.slice(0, 6);

      setOtp(sixDigits);

      refs.current[
        Math.min(5, sixDigits.length - 1)
      ]?.focus();

      return;
    }

    const next = otp
      .padEnd(6, ' ')
      .split('');

    next[index] = digits || ' ';

    setOtp(next.join('').trimEnd());

    if (digits && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <DesignImage source={loginImage}>
      <View
        style={styles.phoneOverlay}
        pointerEvents="box-none"
      >
        <BackButton
          onPress={() => navigation.goBack()}
        />

        <TextInput
          value={phone}
          onChangeText={(value) =>
            setPhone(
              value.replace(/\D/g, '').slice(0, 10),
            )
          }
          keyboardType="phone-pad"
          style={styles.phoneInput}
          placeholder=""
          maxLength={10}
        />

        <Pressable
          style={styles.sendHit}
          onPress={() => void send()}
          disabled={busy}
        />

        {sent && (
          <>
            <View style={styles.otpOverlay}>
              {Array.from(
                { length: 6 },
                (_, index) => (
                  <TextInput
                    key={index}
                    ref={(reference) => {
                      refs.current[index] = reference;
                    }}
                    value={otp[index] || ''}
                    onChangeText={(value) =>
                      updateDigit(index, value)
                    }
                    onKeyPress={({ nativeEvent }) => {
                      if (
                        nativeEvent.key ===
                          'Backspace' &&
                        !otp[index] &&
                        index > 0
                      ) {
                        refs.current[
                          index - 1
                        ]?.focus();
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    style={styles.otpBox}
                  />
                ),
              )}
            </View>

            <Pressable
              style={styles.loginHit}
              onPress={() => void verify()}
              disabled={busy}
            />

            {seconds === 0 && (
              <Pressable
                style={styles.resendHit}
                onPress={() => void send()}
                disabled={busy}
              />
            )}
          </>
        )}

        {message && (
          <View style={styles.message}>
            <InlineMessage>
              {message}
            </InlineMessage>
          </View>
        )}

        <Pressable
          style={styles.signupHit}
          onPress={() =>
            navigation.navigate(
              mode === 'login'
                ? 'SignUp'
                : 'PhoneLogin',
            )
          }
        />
      </View>
    </DesignImage>
  );
}

/*
 * ============================================================
 * ROLE SELECTION
 * ============================================================
 *
 * Existing implementation — preserved.
 */
export function RoleSelectionScreen() {
  const {
    availableRoles,
    selectRole,
  } = useRole();

  const { logout } = useAuth();

  const [loading, setLoading] = useState(false);

  const choose = async (
    code: ApplicationRole,
  ) => {
    const role = availableRoles.find(
      (item) => item.code === code,
    );

    if (!role) {
      Alert.alert(
        'Coming Soon',
        'FPO Dashboard will be added in a future FarmPrism release.',
      );
      return;
    }

    setLoading(true);

    await selectRole(role.id);

    setLoading(false);
  };

  return (
    <DesignImage source={roleImage}>
      <BackButton
        onPress={() => void logout()}
      />

      <View style={styles.roleHits}>
        {(
          [
            'farmer',
            'buyer',
            'logistics',
          ] as ApplicationRole[]
        ).map((role, index) => (
          <Pressable
            key={role}
            disabled={loading}
            onPress={() => void choose(role)}
            style={[
              styles.roleHit,
              index === 0
                ? styles.r1
                : index === 1
                  ? styles.r2
                  : styles.r3,
            ]}
          />
        ))}

        <Pressable
          style={styles.fpoHit}
          onPress={() =>
            Alert.alert(
              'FPO Dashboard',
              'Coming Soon',
            )
          }
        />
      </View>
    </DesignImage>
  );
}

/*
 * ============================================================
 * DASHBOARD PLACEHOLDER
 * ============================================================
 */
export function RoleDashboardPlaceholder({
  role,
}: {
  role: ApplicationRole;
}) {
  const { logout } = useAuth();

  return (
    <ScreenLayout>
      <BrandMark />

      <ScreenIntro
        title={`${role[0].toUpperCase()}${role.slice(1)} workspace`}
        description="Your role-specific FarmPrism experience will appear here."
      />

      <SecondaryButton
        label="Log out"
        onPress={() => void logout()}
      />
    </ScreenLayout>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */
const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#f5f1e8',
  },

  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  /*
   * Get Started
   *
   * The supplied artwork is 1080 × 2340,
   * which matches the intended Android-first
   * 9:19.5 portrait composition.
   */
  getStartedRoot: {
    flex: 1,
    backgroundColor: '#FAFDF8',
    overflow: 'hidden',
  },

  getStartedPage: {
    flex: 1,
    backgroundColor: '#FAFDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  getStartedImage: {
    width: '100%',
    height: '100%',
  },

  /*
   * Transparent hit area over the baked-in
   * Get Started button.
   *
   * This draws NOTHING visually.
   */
  getStartedButtonHit: {
    position: 'absolute',
    left: '5.5%',
    right: '5.5%',
    bottom: '3%',
    height: '6.5%',
    zIndex: 10,
  },

  /*
   * Transparent hit areas over the baked-in
   * page indicator dots.
   */
  getStartedDotHit1: {
    position: 'absolute',
    left: '39%',
    bottom: '8%',
    width: '5.5%',
    height: '3%',
  },

  getStartedDotHit2: {
    position: 'absolute',
    left: '45%',
    bottom: '8%',
    width: '5.5%',
    height: '3%',
  },

  getStartedDotHit3: {
    position: 'absolute',
    left: '51%',
    bottom: '8%',
    width: '5.5%',
    height: '3%',
  },

  getStartedDotHit4: {
    position: 'absolute',
    left: '57%',
    bottom: '8%',
    width: '5.5%',
    height: '3%',
  },

  /*
   * Shared back button.
   */
  backButton: {
    position: 'absolute',
    zIndex: 3,
    top: 54,
    left: 22,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.95)',
    borderWidth: 1,
    borderColor: '#D6E0D5',
    shadowColor: '#1D4527',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
  },

  backButtonLabel: {
    fontSize: 34,
    lineHeight: 38,
    color: '#245B2A',
    fontWeight: '500',
    marginTop: -4,
  },

  /*
   * Phone Login.
   */
  phoneOverlay: {
    ...StyleSheet.absoluteFill,
  },

  phoneInput: {
    position: 'absolute',
    left: '20%',
    top: '42.0%',
    width: '58%',
    height: '4.7%',
    fontSize: 16,
    color: '#24372A',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },

  sendHit: {
    position: 'absolute',
    left: '20%',
    top: '47.1%',
    width: '60%',
    height: '5.1%',
  },

  otpOverlay: {
    position: 'absolute',
    left: '20%',
    top: '59.8%',
    width: '60%',
    height: '5.2%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  otpBox: {
    width: '15.5%',
    height: '100%',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#24372A',
    backgroundColor: 'transparent',
  },

  loginHit: {
    position: 'absolute',
    left: '20%',
    top: '70.8%',
    width: '60%',
    height: '5.3%',
  },

  resendHit: {
    position: 'absolute',
    left: '29%',
    top: '66.0%',
    width: '43%',
    height: '4%',
  },

  signupHit: {
    position: 'absolute',
    left: '25%',
    right: '25%',
    bottom: '1.5%',
    height: '5%',
  },

  message: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: '77%',
    backgroundColor: 'rgba(255,253,247,.95)',
    padding: 8,
    borderRadius: 8,
  },

  /*
   * Role Selection.
   */
  roleHits: {
    ...StyleSheet.absoluteFill,
  },

  roleHit: {
    position: 'absolute',
    width: '36%',
    height: '22%',
  },

  r1: {
    left: '13%',
    top: '32%',
  },

  r2: {
    left: '53%',
    top: '32%',
  },

  r3: {
    left: '53%',
    top: '58%',
  },

  fpoHit: {
    position: 'absolute',
    left: '13%',
    top: '58%',
    width: '36%',
    height: '22%',
  },

  /*
   * Existing language-related styles.
   */
  langOption: {
    height: 58,
    borderWidth: 1,
    borderColor: '#D6E0D5',
    borderRadius: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  langSelected: {
    borderColor: '#2F7A3E',
    borderWidth: 2,
  },

  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#A7B7A9',
    marginRight: 12,
  },

  radioActive: {
    backgroundColor: '#2F7A3E',
    borderColor: '#2F7A3E',
  },

  langText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24442D',
  },
});