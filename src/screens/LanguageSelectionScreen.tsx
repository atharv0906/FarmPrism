import { useState } from 'react';

import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useLanguage } from '../hooks/useLanguage';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

type LanguageCode = 'en' | 'hi' | 'mr';

type LanguageOption = {
  code: LanguageCode;
  title: string;
  nativeTitle: string;
  helper: string;
  symbol: string;
  tone: 'green' | 'orange' | 'purple';
  comingSoon?: boolean;
};

const artwork = {
  logo: require(
    '../../assets/1. FarmPrism_Splash_Assets/farmprism_splash_logo_badge_1024.png',
  ),

  topLeftLeaves: require(
    '../../assets/2. FarmPrism_Language_Assets/language-leaf-branch-dark.png',
  ),

  topRightLeaves: require(
    '../../assets/2. FarmPrism_Language_Assets/language-leaf-branch-light.png',
  ),

  infoLeaf: require(
    '../../assets/2. FarmPrism_Language_Assets/language-single-leaf.png',
  ),

  dividerSprout: require(
    '../../assets/2. FarmPrism_Language_Assets/language-divider-sprout.png',
  ),

  bottomLandscape: require(
    '../../assets/2. FarmPrism_Language_Assets/language-bottom-landscape.png',
  ),
};

const languageOptions: LanguageOption[] = [
  {
    code: 'en',
    title: 'English',
    nativeTitle: 'English',
    helper: 'Continue in English',
    symbol: 'A',
    tone: 'green',
  },
  {
    code: 'hi',
    title: 'Hindi',
    nativeTitle: 'हिन्दी',
    helper: 'हिन्दी में जारी रखें',
    symbol: 'अ',
    tone: 'orange',
    comingSoon: true,
  },
  {
    code: 'mr',
    title: 'Marathi',
    nativeTitle: 'मराठी',
    helper: 'मराठीत सुरू ठेवा',
    symbol: 'म',
    tone: 'purple',
    comingSoon: true,
  },
];

export function LanguageSelectionScreen({
  navigation,
}: NativeStackScreenProps<
  AuthStackParamList,
  'LanguageSelection'
>) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const {
    language,
    setLanguage,
    error,
  } = useLanguage();

  /*
   * Hindi and Marathi are displayed in the approved UI,
   * but their full translated app experience is not ready yet.
   */
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageCode>(
      language === 'en' ? language : 'en',
    );

  const [saving, setSaving] = useState(false);

  const compact = height < 760;
  const canGoBack = navigation.canGoBack();

  const selectLanguage = (option: LanguageOption) => {
    if (option.comingSoon) {
      Alert.alert(
        'Coming Soon',
        option.code === 'hi'
          ? 'Hindi language support is coming soon.'
          : 'Marathi language support is coming soon.',
      );

      return;
    }

    setSelectedLanguage(option.code);
  };

  const saveAndContinue = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await setLanguage(selectedLanguage);

      navigation.navigate('GetStarted');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Decorative top artwork */}
      <Image
        pointerEvents="none"
        source={artwork.topLeftLeaves}
        resizeMode="contain"
        style={styles.topLeftLeaves}
      />

      <Image
        pointerEvents="none"
        source={artwork.topRightLeaves}
        resizeMode="contain"
        style={styles.topRightLeaves}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop:
              insets.top + (compact ? 10 : 18),

            paddingBottom:
              Math.max(insets.bottom, 12) + 12,
          },
        ]}
      >
        {/* Approved FarmPrism logo */}
        <Image
          source={artwork.logo}
          resizeMode="contain"
          fadeDuration={0}
          accessibilityLabel="FarmPrism"
          style={[
            styles.logo,
            compact && styles.logoCompact,
          ]}
        />

        <Text
          style={[
            styles.heading,
            compact && styles.headingCompact,
          ]}
        >
          Choose Your Language
        </Text>

        <Text style={styles.subtitle}>
          Select the language you’re most comfortable with
        </Text>

        {/* Language cards */}
        <View style={styles.languageList}>
          {languageOptions.map((option) => {
            const selected =
              selectedLanguage === option.code;

            return (
              <Pressable
                key={option.code}
                accessibilityRole="radio"
                accessibilityLabel={`${option.title} ${option.nativeTitle}`}
                accessibilityHint={
                  option.comingSoon
                    ? 'This language is coming soon'
                    : 'Select English'
                }
                accessibilityState={{
                  selected,
                }}
                onPress={() => selectLanguage(option)}
                style={({ pressed }) => [
                  styles.languageCard,

                  selected &&
                    styles.languageCardSelected,

                  pressed &&
                    styles.languageCardPressed,
                ]}
              >
                <View
                  style={[
                    styles.languageIcon,

                    option.tone === 'green' &&
                      styles.languageIconGreen,

                    option.tone === 'orange' &&
                      styles.languageIconOrange,

                    option.tone === 'purple' &&
                      styles.languageIconPurple,
                  ]}
                >
                  <Text
                    style={[
                      styles.languageSymbol,

                      option.tone === 'orange' &&
                        styles.languageSymbolOrange,

                      option.tone === 'purple' &&
                        styles.languageSymbolPurple,
                    ]}
                  >
                    {option.symbol}
                  </Text>
                </View>

                <View style={styles.languageTextArea}>
                  <View style={styles.languageTitleRow}>
                    <Text style={styles.languageTitle}>
                      {option.title}
                    </Text>

                    {option.nativeTitle !==
                      option.title && (
                      <Text
                        style={
                          styles.languageNativeTitle
                        }
                      >
                        {option.nativeTitle}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.languageHelper}>
                    {option.helper}
                  </Text>

                  {option.comingSoon && (
                    <Text style={styles.comingSoon}>
                      Coming soon
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.radioOuter,

                    selected
                      ? styles.radioOuterSelected
                      : styles.radioOuterIdle,
                  ]}
                >
                  {selected && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Info box */}
        <View style={styles.infoCard}>
          <Image
            source={artwork.infoLeaf}
            resizeMode="contain"
            style={styles.infoLeaf}
          />

          <View style={styles.infoTextArea}>
            <Text style={styles.infoTitle}>
              You can change this later
            </Text>

            <Text style={styles.infoText}>
              Your language preference can be updated anytime
              from Settings.
            </Text>
          </View>
        </View>

        {error && (
          <Text accessibilityRole="alert" style={styles.errorText}>
            We couldn’t save your previous language preference.
            You can still continue.
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityState={{
              disabled: !canGoBack,
            }}
            disabled={!canGoBack || saving}
            onPress={() => {
              if (canGoBack) {
                navigation.goBack();
              }
            }}
            style={({ pressed }) => [
              styles.backButton,

              !canGoBack &&
                styles.backButtonDisabled,

              pressed &&
                canGoBack &&
                styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.backButtonText,

                !canGoBack &&
                  styles.backButtonTextDisabled,
              ]}
            >
              ←  Back
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save and Continue"
            accessibilityState={{
              disabled: saving,
              busy: saving,
            }}
            disabled={saving}
            onPress={() => {
              void saveAndContinue();
            }}
            style={({ pressed }) => [
              styles.continueButton,

              saving &&
                styles.continueButtonDisabled,

              pressed &&
                !saving &&
                styles.buttonPressed,
            ]}
          >
            <Text style={styles.continueButtonText}>
              {saving
                ? 'Saving...'
                : 'Save & Continue'}
            </Text>

            {!saving && (
              <Text style={styles.continueArrow}>
                →
              </Text>
            )}
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />

          <Image
            source={artwork.dividerSprout}
            resizeMode="contain"
            style={styles.dividerSprout}
          />

          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.footerQuote}>
          Rooted in tradition. Growing with technology.
        </Text>

        {/* Bottom decorative artwork */}
        <View style={styles.landscapeFrame}>
          <Image
            source={artwork.bottomLandscape}
            resizeMode="cover"
            fadeDuration={0}
            style={styles.landscape}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F9EF',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    alignItems: 'center',
  },

  topLeftLeaves: {
    position: 'absolute',
    top: -12,
    left: -20,
    width: 118,
    height: 118,
    opacity: 0.95,
    zIndex: 1,
  },

  topRightLeaves: {
    position: 'absolute',
    top: -16,
    right: -18,
    width: 120,
    height: 120,
    opacity: 0.9,
    zIndex: 1,
  },

  logo: {
    width: 92,
    height: 92,
    marginBottom: 14,
  },

  logoCompact: {
    width: 78,
    height: 78,
    marginBottom: 8,
  },

  heading: {
    color: '#174D2A',
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '700',

    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),

    textAlign: 'center',
  },

  headingCompact: {
    fontSize: 26,
    lineHeight: 32,
  },

  subtitle: {
    marginTop: 7,
    paddingHorizontal: 18,

    color: '#667064',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  languageList: {
    width: '100%',
    marginTop: 24,
    gap: 13,
  },

  languageCard: {
    minHeight: 78,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 15,
    paddingVertical: 12,

    backgroundColor: '#FFFFFF',

    borderWidth: 1.3,
    borderColor: '#D7DFD0',
    borderRadius: 17,

    shadowColor: '#1A3D27',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  languageCardSelected: {
    backgroundColor: '#F2F8EC',
    borderColor: '#24733D',
    borderWidth: 2,
  },

  languageCardPressed: {
    transform: [
      {
        scale: 0.992,
      },
    ],
  },

  languageIcon: {
    width: 46,
    height: 46,

    borderRadius: 23,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 13,
  },

  languageIconGreen: {
    backgroundColor: '#E6F2E5',
  },

  languageIconOrange: {
    backgroundColor: '#FFF0DC',
  },

  languageIconPurple: {
    backgroundColor: '#EEE8F8',
  },

  languageSymbol: {
    color: '#24733D',
    fontSize: 21,
    fontWeight: '800',
  },

  languageSymbolOrange: {
    color: '#C56C18',
  },

  languageSymbolPurple: {
    color: '#7552A8',
  },

  languageTextArea: {
    flex: 1,
    paddingRight: 10,
  },

  languageTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },

  languageTitle: {
    color: '#203E2A',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },

  languageNativeTitle: {
    marginLeft: 7,

    color: '#4E5C52',
    fontSize: 14,
    fontWeight: '600',
  },

  languageHelper: {
    marginTop: 2,

    color: '#7A8279',
    fontSize: 12.5,
    lineHeight: 17,
  },

  comingSoon: {
    marginTop: 3,

    color: '#A06C23',
    fontSize: 11,
    fontWeight: '700',
  },

  radioOuter: {
    width: 23,
    height: 23,

    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  radioOuterIdle: {
    borderWidth: 2,
    borderColor: '#A5ADA6',
  },

  radioOuterSelected: {
    borderWidth: 2,
    borderColor: '#24733D',
  },

  radioInner: {
    width: 11,
    height: 11,

    borderRadius: 6,

    backgroundColor: '#24733D',
  },

  infoCard: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 20,

    paddingHorizontal: 14,
    paddingVertical: 12,

    backgroundColor: '#EDF5E7',

    borderWidth: 1,
    borderColor: '#D4E4CB',
    borderRadius: 15,
  },

  infoLeaf: {
    width: 38,
    height: 38,
    marginRight: 11,
  },

  infoTextArea: {
    flex: 1,
  },

  infoTitle: {
    color: '#28543A',
    fontSize: 13.5,
    fontWeight: '700',
  },

  infoText: {
    marginTop: 2,

    color: '#667367',
    fontSize: 12,
    lineHeight: 17,
  },

  errorText: {
    width: '100%',
    marginTop: 10,

    color: '#A04435',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },

  actions: {
    width: '100%',
    flexDirection: 'row',

    marginTop: 21,
    gap: 12,
  },

  backButton: {
    minHeight: 50,
    flex: 0.9,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1.4,
    borderColor: '#A7B0A5',
    borderRadius: 13,

    backgroundColor: '#F8FAF3',
  },

  backButtonDisabled: {
    opacity: 0.58,
  },

  backButtonText: {
    color: '#59645B',
    fontSize: 14,
    fontWeight: '700',
  },

  backButtonTextDisabled: {
    color: '#8B938B',
  },

  continueButton: {
    minHeight: 50,
    flex: 1.45,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 15,

    backgroundColor: '#176A36',
    borderRadius: 13,

    shadowColor: '#123C24',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  continueButtonDisabled: {
    opacity: 0.65,
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  continueArrow: {
    marginLeft: 10,

    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },

  buttonPressed: {
    opacity: 0.86,
  },

  divider: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 24,
  },

  dividerLine: {
    flex: 1,
    height: 1,

    backgroundColor: '#CBD7C3',
  },

  dividerSprout: {
    width: 32,
    height: 32,

    marginHorizontal: 12,
  },

  footerQuote: {
    marginTop: 7,
    marginBottom: 12,

    color: '#6D786B',
    fontSize: 12.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  landscapeFrame: {
    width: '100%',
    height: 142,

    marginTop: 2,

    borderRadius: 17,
    overflow: 'hidden',
  },

  landscape: {
    width: '100%',
    height: '100%',
  },
});