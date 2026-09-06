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
 * ============================================================
 * GET STARTED ARTWORK
 * ============================================================
 *
 * These are the four approved individual FarmPrism onboarding
 * screens.
 *
 * IMPORTANT:
 * Do not replace these with the old 4-in-1 collage.
 */
const getStartedSlides = [
  require('../../assets/2a_intro.png'),
  require('../../assets/2b_intro.png'),
  require('../../assets/2c_intro.png'),
  require('../../assets/2d_intro.png'),
] as const;

/*
 * ============================================================
 * LANGUAGE SELECTION ARTWORK
 * ============================================================
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

/*
 * ============================================================
 * LOGIN / ROLE ARTWORK
 * ============================================================
 */

const loginImage = require('../../assets/3.mainlogin.png');
const roleImage = require('../../assets/4.select role.png');

/*
 * ============================================================
 * DESIGN IMAGE
 * ============================================================
 */

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

/*
 * ============================================================
 * BACK BUTTON
 * ============================================================
 */

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
 * VISUAL SOURCE OF TRUTH:
 * FarmPrism / Lovable onboarding design.
 *
 * The supplied 2a–2d images already contain:
 *
 * - FarmPrism branding
 * - illustrations
 * - headings
 * - descriptions
 * - page indicator artwork
 * - bottom white section
 * - Get Started button
 * - arrow
 *
 * Therefore React Native MUST NOT draw another visible button
 * or another visible set of page indicators.
 *
 * React Native supplies ONLY transparent interaction zones.
 *
 * The Get Started control is therefore visually STATIC.
 *
 * The artwork itself never moves vertically and is never cropped.
 */

export function GetStartedScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'GetStarted'>) {
  const { width, height } = useWindowDimensions();

  const pagerRef = useRef<FlatList<number>>(null);

  const [page, setPage] = useState(0);

  /*
   * Move to a specific onboarding page.
   */
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

  /*
   * Static Get Started button behavior:
   *
   * Slide 1 → Slide 2
   * Slide 2 → Slide 3
   * Slide 3 → Slide 4
   * Slide 4 → Login
   */
  const continueFromPage = () => {
    if (page === getStartedSlides.length - 1) {
      navigation.navigate('PhoneLogin');
      return;
    }

    goToPage(page + 1);
  };

  /*
   * Update current slide after a swipe.
   */
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

      /*
       * --------------------------------------------------------
       * BACK BUTTON
       * --------------------------------------------------------
       *
       * Matches the Lovable onboarding flow.
       *
       * This is the only visible React-rendered control.
       * It does not interfere with the artwork.
       */
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to language selection"
        hitSlop={8}
        onPress={() => navigation.navigate('LanguageSelection')}
        style={styles.getStartedBackButton}
      >
        <Text style={styles.getStartedBackLabel}>←</Text>
      </Pressable>

      /*
       * --------------------------------------------------------
       * HORIZONTAL ONBOARDING TRACK
       * --------------------------------------------------------
       */
      <FlatList
        ref={pagerRef}
        data={getStartedSlides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
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
              fadeDuration={0}
              style={[
                styles.getStartedImage,
                {
                  width,
                  height,
                },
              ]}
            />
          </View>
        )}
      />

      /*
       * --------------------------------------------------------
       * STATIC GET STARTED BUTTON HIT AREA
       * --------------------------------------------------------
       *
       * IMPORTANT:
       *
       * This Pressable has NO background, NO text and NO border.
       *
       * The visible button comes exclusively from the artwork.
       *
       * It is positioned relative to the complete screen so the
       * visible artwork remains untouched.
       */
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Get Started"
        onPress={continueFromPage}
        style={styles.getStartedButtonHit}
      />

      /*
       * --------------------------------------------------------
       * STATIC PAGE INDICATOR HIT AREAS
       * --------------------------------------------------------
       *
       * The actual dots are already painted inside each image.
       * These Pressables are invisible.
       */
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to onboarding screen 1"
        onPress={() => goToPage(0)}
        style={styles.getStartedDotHit1}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to onboarding screen 2"
        onPress={() => goToPage(1)}
        style={styles.getStartedDotHit2}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to onboarding screen 3"
        onPress={() => goToPage(2)}
        style={styles.getStartedDotHit3}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to onboarding screen 4"
        onPress={() => goToPage(3)}
        style={styles.getStartedDotHit4}
      />
    </View>
  );
}

/*
 * ============================================================
 * LANGUAGE SELECTION
 * ============================================================
 *
 * Existing implementation preserved.
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
      setMessage('Enter the 6-digit OTP.');
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      await verifyOtp(phone, otp);
      navigation.navigate('RoleSelection');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Invalid OTP.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <DesignImage source={loginImage}>
      <BackButton
        onPress={() => navigation.goBack()}
      />

      <Pressable
        style={styles.loginPhoneHit}
        onPress={() => {}}
      />

      <TextInput
        value={phone}
        onChangeText={(value) =>
          setPhone(value.replace(/\D/g, '').slice(0, 10))
        }
        keyboardType="phone-pad"
        maxLength={10}
        placeholder="Enter mobile number"
        placeholderTextColor="#7B847D"
        style={styles.phoneInput}
      />

      <Pressable
        style={styles.sendHit}
        onPress={() => void send()}
        disabled={busy}
      />

      {sent && (
        <View style={styles.otpOverlay}>
          {Array.from({ length: 6 }).map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                refs.current[index] = ref;
              }}
              value={otp[index] ?? ''}
              onChangeText={(value) => {
                const digit = value
                  .replace(/\D/g, '')
                  .slice(-1);

                const next = otp.split('');
                next[index] = digit;

                const nextOtp = next.join('');
                setOtp(nextOtp);

                if (
                  digit &&
                  index < 5
                ) {
                  refs.current[index + 1]?.focus();
                }
              }}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.otpBox}
            />
          ))}
        </View>
      )}

      <Pressable
        style={styles.loginHit}
        onPress={() => void verify()}
        disabled={busy}
      />

      <Pressable
        style={styles.resendHit}
        onPress={() => {
          if (seconds === 0) {
            void send();
          }
        }}
        disabled={busy || seconds > 0}
      />

      <Pressable
        style={styles.signupHit}
        onPress={() =>
          navigation.navigate('SignUp')
        }
      />

      {message && (
        <View style={styles.message}>
          <Text style={styles.messageText}>
            {message}
          </Text>
        </View>
      )}
    </DesignImage>
  );
}

/*
 * ============================================================
 * ROLE SELECTION
 * ============================================================
 */

export function RoleSelectionScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'RoleSelection'>) {
  const { role, setRole } = useRole();

  const chooseRole = async (
    nextRole: ApplicationRole,
  ) => {
    await setRole(nextRole);

    if (nextRole === 'farmer') {
      navigation.navigate('FarmerPersonal');
      return;
    }

    Alert.alert(
      'Coming Soon',
      'This FarmPrism role will be available in a future phase.',
    );
  };

  return (
    <DesignImage source={roleImage}>
      <View
        pointerEvents="box-none"
        style={styles.roleHits}
      >
        <Pressable
          style={[
            styles.roleHit,
            styles.r1,
          ]}
          onPress={() =>
            void chooseRole('farmer')
          }
        />

        <Pressable
          style={[
            styles.roleHit,
            styles.r2,
          ]}
          onPress={() =>
            void chooseRole('buyer')
          }
        />

        <Pressable
          style={[
            styles.roleHit,
            styles.r3,
          ]}
          onPress={() =>
            void chooseRole('logistics')
          }
        />

        <Pressable
          style={styles.fpoHit}
          onPress={() =>
            Alert.alert(
              'Coming Soon',
              'FPO functionality will be introduced in a future phase.',
            )
          }
        />
      </View>
    </DesignImage>
  );
}

/*
 * ============================================================
 * ROLE DASHBOARD PLACEHOLDER
 * ============================================================
 */

export function RoleDashboardPlaceholder() {
  return (
    <ScreenLayout>
      <BrandMark />

      <ScreenIntro
        eyebrow="FarmPrism"
        title="Dashboard"
        description="Your FarmPrism dashboard will be available here."
      />

      <InlineMessage>
        This is a temporary dashboard placeholder for the
        current implementation phase.
      </InlineMessage>

      <PrimaryButton
        title="Dashboard Ready"
        onPress={() => {}}
      />

      <SecondaryButton
        title="Continue"
        onPress={() => {}}
      />

      <TextButton
        title="Back"
        onPress={() => {}}
      />

      <Field
        label="Status"
        value="Prototype"
        onChangeText={() => {}}
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
  /*
   * General canvas
   */
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
   * ==========================================================
   * GET STARTED
   * ==========================================================
   */

  getStartedRoot: {
    flex: 1,
    backgroundColor: '#FAFDF8',
    overflow: 'hidden',
  },

  getStartedPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFDF8',
    overflow: 'hidden',
  },

  getStartedImage: {
    resizeMode: 'contain',
  },

  /*
   * Lovable-style top-left back control.
   *
   * This is intentionally small and unobtrusive so it does not
   * interfere with the supplied artwork.
   */
  getStartedBackButton: {
    position: 'absolute',
    zIndex: 20,
    top: 10,
    left: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.70)',
  },

  getStartedBackLabel: {
    fontSize: 26,
    lineHeight: 30,
    color: '#245B2A',
    fontWeight: '500',
    marginTop: -2,
  },

  /*
   * Static transparent hit area over the baked-in
   * Get Started button.
   */
  getStartedButtonHit: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    bottom: '1.6%',
    height: '6%',
    backgroundColor: 'transparent',
  },

  /*
   * Transparent page indicator hit areas.
   *
   * These are deliberately wider than the visible dots to make
   * tapping easier on Android.
   */
  getStartedDotHit1: {
    position: 'absolute',
    left: '34%',
    bottom: '7.0%',
    width: '8%',
    height: '5%',
    backgroundColor: 'transparent',
  },

  getStartedDotHit2: {
    position: 'absolute',
    left: '43%',
    bottom: '7.0%',
    width: '8%',
    height: '5%',
    backgroundColor: 'transparent',
  },

  getStartedDotHit3: {
    position: 'absolute',
    left: '52%',
    bottom: '7.0%',
    width: '8%',
    height: '5%',
    backgroundColor: 'transparent',
  },

  getStartedDotHit4: {
    position: 'absolute',
    left: '61%',
    bottom: '7.0%',
    width: '8%',
    height: '5%',
    backgroundColor: 'transparent',
  },

  /*
   * ==========================================================
   * OTHER EXISTING UI
   * ==========================================================
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

  phoneOverlay: {
    ...StyleSheet.absoluteFillObject,
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

  loginPhoneHit: {
    position: 'absolute',
    left: '20%',
    top: '40.5%',
    width: '60%',
    height: '8%',
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

  messageText: {
    fontSize: 13,
    color: '#24372A',
    textAlign: 'center',
  },

  roleHits: {
    ...StyleSheet.absoluteFillObject,
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
});