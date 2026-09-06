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
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import type { ApplicationRole } from '../types/role';

const getStartedReferences = [
  require('../../assets/2a_intro.png'),
  require('../../assets/2b_intro.png'),
  require('../../assets/2c_intro.png'),
  require('../../assets/2d_intro.png'),
] as const;

const languageSelectorImage = require('../../assets/1a.lang sel.png');
const loginImage = require('../../assets/3.mainlogin.png');
const roleImage = require('../../assets/4.select role.png');

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
    top: '42%',
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
    top: '35%',
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
    top: '47%',
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
    top: '59%',
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

/* ============================================================
 * GET STARTED
 * ============================================================ */

const onboardingContent = [
  {
    title: 'Welcome to FarmPrism',
    description:
      'From soil to sell, FarmPrism helps you grow, connect and move your produce with confidence.',
    accent: 'Grow together',
  },
  {
    title: 'Grow Smarter Every Season',
    description:
      'Keep your farming journey organised and make better decisions season after season.',
    accent: 'Farm smarter',
  },
  {
    title: 'Fair Prices, Real Opportunities',
    description:
      'Discover better market opportunities and connect your produce with the right buyers.',
    accent: 'Sell better',
  },
  {
    title: 'Stronger Together',
    description:
      'Farmers, buyers, logistics and the wider agricultural network work better together.',
    accent: 'Build together',
  },
] as const;

function ReferenceIllustration({
  source,
  width,
  height,
}: {
  source: any;
  width: number;
  height: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.referenceIllustrationFrame,
        {
          width: width * 0.88,
          height: height * 0.42,
        },
      ]}
    >
      <Image
        source={source}
        resizeMode="cover"
        fadeDuration={0}
        style={[
          styles.referenceIllustrationImage,
          {
            width: width * 0.88,
            height: height * 0.88,
          },
        ]}
      />
    </View>
  );
}

export function GetStartedScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'GetStarted'>) {
  const { width, height } = useWindowDimensions();

  const pagerRef = useRef<FlatList<number>>(null);
  const [page, setPage] = useState(0);

  const goToPage = (nextPage: number) => {
    const safePage = Math.max(
      0,
      Math.min(getStartedReferences.length - 1, nextPage),
    );

    setPage(safePage);

    requestAnimationFrame(() => {
      pagerRef.current?.scrollToOffset({
        offset: safePage * width,
        animated: true,
      });
    });
  };

  const continueFromPage = () => {
    if (page < getStartedReferences.length - 1) {
      goToPage(page + 1);
      return;
    }

    navigation.navigate('PhoneLogin');
  };

  const handleScrollEnd = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;

    if (width <= 0) {
      return;
    }

    const nextPage = Math.round(offset / width);

    if (
      nextPage >= 0 &&
      nextPage < getStartedReferences.length
    ) {
      setPage(nextPage);
    }
  };

  return (
    <View style={styles.getStartedRoot}>
      <StatusBar hidden />

      <FlatList
        ref={pagerRef}
        data={[0, 1, 2, 3]}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        scrollEventThrottle={16}
        keyExtractor={(item) => `get-started-${item}`}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => {
          const content = onboardingContent[item];

          return (
            <View
              style={[
                styles.getStartedPage,
                {
                  width,
                  height,
                },
              ]}
            >
              <View
                style={[
                  styles.getStartedTopArea,
                  {
                    height: height * 0.56,
                  },
                ]}
              >
                <View style={styles.brandRow}>
                  <View style={styles.brandLeaf}>
                    <Text style={styles.brandLeafText}>⌁</Text>
                  </View>

                  <Text style={styles.brandName}>
                    FarmPrism
                  </Text>
                </View>

                <ReferenceIllustration
                  source={getStartedReferences[item]}
                  width={width}
                  height={height}
                />
              </View>

              <View
                style={[
                  styles.getStartedCard,
                  {
                    minHeight: height * 0.44,
                  },
                ]}
              >
                <View style={styles.accentPill}>
                  <Text style={styles.accentPillText}>
                    {content.accent}
                  </Text>
                </View>

                <Text style={styles.getStartedTitle}>
                  {content.title}
                </Text>

                <Text style={styles.getStartedDescription}>
                  {content.description}
                </Text>

                <View style={styles.pagination}>
                  {[0, 1, 2, 3].map((dot) => (
                    <Pressable
                      key={dot}
                      accessibilityRole="button"
                      accessibilityLabel={`Go to onboarding screen ${dot + 1}`}
                      onPress={() => goToPage(dot)}
                      style={[
                        styles.paginationDot,
                        dot === page &&
                          styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    page === 3
                      ? 'Get started'
                      : 'Next onboarding screen'
                  }
                  onPress={continueFromPage}
                  style={({ pressed }) => [
                    styles.getStartedButton,
                    pressed && styles.getStartedButtonPressed,
                  ]}
                >
                  <Text style={styles.getStartedButtonText}>
                    Get Started
                  </Text>

                  <Text style={styles.getStartedButtonArrow}>
                    →
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to language selection"
        hitSlop={8}
        onPress={() =>
          navigation.navigate('LanguageSelection')
        }
        style={styles.getStartedBackButton}
      >
        <Text style={styles.getStartedBackLabel}>←</Text>
      </Pressable>
    </View>
  );
}

/* ============================================================
 * LANGUAGE SELECTION
 * ============================================================ */

export function LanguageSelectionScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'LanguageSelection'>) {
  const {
    language,
    setLanguage,
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
        style={styles.languageSelectorImage}
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

/* ============================================================
 * PHONE LOGIN / SIGNUP
 * ============================================================ */

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
  const [message, setMessage] = useState<string | null>(null);
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
      <BackButton onPress={() => navigation.goBack()} />

      <TextInput
        value={phone}
        onChangeText={(value) =>
          setPhone(
            value.replace(/\D/g, '').slice(0, 10),
          )
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
        onPress={() => {
          if (mode === 'login') {
            navigation.navigate('SignUp');
          }
        }}
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

/* ============================================================
 * ROLE SELECTION
 * ============================================================ */

export function RoleSelectionScreen({
}: NativeStackScreenProps<
  OnboardingStackParamList,
  'RoleSelection'
>) {
  const { selectRole } = useRole();

  const chooseRole = async (
    nextRole: ApplicationRole,
  ) => {
    try {
      await selectRole(nextRole);
    } catch (error) {
      Alert.alert(
        'Unable to select role',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    }
  };

  return (
    <DesignImage source={roleImage}>
      <View
        pointerEvents="box-none"
        style={styles.roleHits}
      >
        <Pressable
          style={[styles.roleHit, styles.r1]}
          onPress={() =>
            void chooseRole('farmer')
          }
        />

        <Pressable
          style={[styles.roleHit, styles.r2]}
          onPress={() =>
            void chooseRole('buyer')
          }
        />

        <Pressable
          style={[styles.roleHit, styles.r3]}
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

/* ============================================================
 * ROLE DASHBOARD PLACEHOLDER
 * ============================================================ */

export function RoleDashboardPlaceholder({
  role,
}: {
  role: ApplicationRole;
}) {
  return (
    <ScreenLayout>
      <BrandMark />

      <ScreenIntro
        title="Dashboard"
        description={`Your ${role} dashboard will be available here.`}
      />

      <InlineMessage tone="info">
        This is a temporary dashboard placeholder for the
        current implementation phase.
      </InlineMessage>

      <PrimaryButton
        label="Dashboard Ready"
        onPress={() => {}}
      />

      <SecondaryButton
        label="Continue"
        onPress={() => {}}
      />

      <TextButton
        label="Back"
        onPress={() => {}}
      />

      <Field
        label="Status"
        value="Prototype"
        onChangeText={() => {}}
        placeholder="Status"
      />
    </ScreenLayout>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },

  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  /* Get Started */

  getStartedRoot: {
    flex: 1,
    backgroundColor: '#F7F4EA',
    overflow: 'hidden',
  },

  getStartedPage: {
    flex: 1,
    backgroundColor: '#F7F4EA',
  },

  getStartedTopArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 44,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  brandLeaf: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCEBD5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandLeafText: {
    fontSize: 22,
    color: '#2F6F3B',
    fontWeight: '800',
  },

  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#24442D',
  },

  referenceIllustrationFrame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
  },

  referenceIllustrationImage: {
    resizeMode: 'cover',
  },

  getStartedCard: {
    flex: 1,
    width: '100%',
    marginTop: -4,
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  accentPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EAF4E5',
    marginBottom: 14,
  },

  accentPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2F7A3E',
    letterSpacing: 0.4,
  },

  getStartedTitle: {
    width: '100%',
    textAlign: 'center',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    color: '#24442D',
  },

  getStartedDescription: {
    width: '94%',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
    color: '#657267',
  },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 20,
    marginBottom: 18,
  },

  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8D4C7',
  },

  paginationDotActive: {
    width: 24,
    backgroundColor: '#2F7A3E',
  },

  getStartedButton: {
    width: '100%',
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#2F7A3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    elevation: 3,
    shadowColor: '#24442D',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  getStartedButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  getStartedButtonArrow: {
    position: 'absolute',
    right: 20,
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
  },

  getStartedBackButton: {
    position: 'absolute',
    zIndex: 20,
    top: 12,
    left: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#D6E0D5',
  },

  getStartedBackLabel: {
    fontSize: 25,
    lineHeight: 30,
    color: '#245B2A',
    fontWeight: '600',
  },

  /* Existing screens */

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

  languageSelectorImage: {
    width: '100%',
    height: '100%',
  },

  phoneInput: {
    position: 'absolute',
    left: '20%',
    top: '42%',
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
    top: '66%',
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
});