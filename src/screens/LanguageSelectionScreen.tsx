import { useState } from 'react';

import {
  Alert,
  Image,
  Pressable,
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
  helper: string;
  symbol: string;
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
    helper: 'Continue in English',
    symbol: 'globe',
  },
  {
    code: 'hi',
    title: 'हिंदी',
    helper: 'हिंदी में जारी रखें',
    symbol: 'हि',
    comingSoon: true,
  },
  {
    code: 'mr',
    title: 'मराठी',
    helper: 'मराठीत सुरू ठेवा',
    symbol: 'म',
    comingSoon: true,
  },
];

function GlobeIcon() {
  return (
    <View style={styles.globe}>
      <View style={styles.globeVertical} />
      <View style={styles.globeHorizontal} />
      <View style={styles.globeUpperArc} />
      <View style={styles.globeLowerArc} />
    </View>
  );
}

export function LanguageSelectionScreen({
  navigation,
}: NativeStackScreenProps<
  AuthStackParamList,
  'LanguageSelection'
>) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const {
    setLanguage,
    error,
  } = useLanguage();

  const scale = Math.max(
    0.9,
    Math.min(
      1.04,
      Math.min(width / 392, height / 850),
    ),
  );

  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageCode>('en');

  const [saving, setSaving] = useState(false);

  const landscapeHeight = 166 * scale;

  const selectLanguage = (
    option: LanguageOption,
  ) => {
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
      <StatusBar hidden />

      {/* Top decorative leaves */}
      <Image
        pointerEvents="none"
        source={artwork.topLeftLeaves}
        resizeMode="contain"
        style={[
          styles.topLeftLeaves,
          {
            width: 128 * scale,
            height: 108 * scale,
          },
        ]}
      />

      <Image
        pointerEvents="none"
        source={artwork.topRightLeaves}
        resizeMode="contain"
        style={[
          styles.topRightLeaves,
          {
            width: 118 * scale,
            height: 104 * scale,
          },
        ]}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop:
              Math.max(insets.top, 4) +
              6 * scale,

            paddingBottom:
              landscapeHeight +
              Math.max(insets.bottom, 0),
          },
        ]}
      >
        {/* Logo */}
        <Image
          source={artwork.logo}
          resizeMode="contain"
          fadeDuration={0}
          accessibilityLabel="FarmPrism"
          style={{
            width: 92 * scale,
            height: 92 * scale,
          }}
        />

        {/* Title */}
        <Text
          style={[
            styles.heading,
            {
              fontSize: 30 * scale,
              lineHeight: 35 * scale,
            },
          ]}
        >
          <Text style={styles.headingDark}>
            Choose Your{' '}
          </Text>

          <Text style={styles.headingGreen}>
            Language
          </Text>
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              fontSize: 14 * scale,
              lineHeight: 19 * scale,
            },
          ]}
        >
          {'Select your preferred language.\nYou can change it anytime from Profile.'}
        </Text>

        {/* Top divider */}
        <View
          style={[
            styles.headerDivider,
            {
              marginTop: 8 * scale,
            },
          ]}
        >
          <View style={styles.headerDividerLine} />

          <Image
            source={artwork.dividerSprout}
            resizeMode="contain"
            style={{
              width: 48 * scale,
              height: 28 * scale,
              marginHorizontal: 10 * scale,
            }}
          />

          <View style={styles.headerDividerLine} />
        </View>

        {/* Language cards */}
        <View
          style={[
            styles.languageList,
            {
              marginTop: 8 * scale,
              gap: 10 * scale,
            },
          ]}
        >
          {languageOptions.map((option) => {
            const selected =
              selectedLanguage === option.code;

            return (
              <Pressable
                key={option.code}
                accessibilityRole="radio"
                accessibilityLabel={option.title}
                accessibilityState={{
                  selected,
                }}
                accessibilityHint={
                  option.comingSoon
                    ? 'This language is coming soon'
                    : undefined
                }
                onPress={() =>
                  selectLanguage(option)
                }
                style={({ pressed }) => [
                  styles.languageCard,

                  {
                    minHeight: 82 * scale,
                    paddingHorizontal:
                      16 * scale,
                    borderRadius:
                      13 * scale,
                  },

                  selected &&
                    styles.languageCardSelected,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.languageIcon,
                    {
                      width: 54 * scale,
                      height: 54 * scale,
                      borderRadius:
                        27 * scale,
                      marginRight:
                        15 * scale,
                    },
                  ]}
                >
                  {option.symbol ===
                  'globe' ? (
                    <GlobeIcon />
                  ) : (
                    <Text
                      style={[
                        styles.languageSymbol,
                        {
                          fontSize:
                            option.code ===
                            'hi'
                              ? 24 *
                                scale
                              : 27 *
                                scale,
                        },
                      ]}
                    >
                      {option.symbol}
                    </Text>
                  )}
                </View>

                <View
                  style={
                    styles.languageTextArea
                  }
                >
                  <Text
                    style={[
                      styles.languageTitle,
                      {
                        fontSize:
                          17 * scale,

                        lineHeight:
                          22 * scale,
                      },
                    ]}
                  >
                    {option.title}
                  </Text>

                  <Text
                    style={[
                      styles.languageHelper,
                      {
                        fontSize:
                          13 * scale,

                        lineHeight:
                          18 * scale,
                      },
                    ]}
                  >
                    {option.helper}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,

                    {
                      width: 27 * scale,
                      height:
                        27 * scale,

                      borderRadius:
                        14 * scale,
                    },

                    selected
                      ? styles.radioSelected
                      : styles.radioIdle,
                  ]}
                >
                  {selected && (
                    <View
                      style={[
                        styles.radioInner,
                        {
                          width:
                            15 * scale,

                          height:
                            15 * scale,

                          borderRadius:
                            8 * scale,
                        },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Information banner */}
        <View
          style={[
            styles.infoCard,
            {
              minHeight: 66 * scale,
              marginTop: 13 * scale,

              borderRadius:
                12 * scale,

              paddingHorizontal:
                14 * scale,
            },
          ]}
        >
          <View
            style={[
              styles.infoIcon,
              {
                width: 38 * scale,
                height: 38 * scale,

                borderRadius:
                  19 * scale,
              },
            ]}
          >
            <Text
              style={[
                styles.infoIconText,
                {
                  fontSize: 24 * scale,
                },
              ]}
            >
              i
            </Text>
          </View>

          <Text
            style={[
              styles.infoText,
              {
                fontSize:
                  13.5 * scale,

                lineHeight:
                  19 * scale,
              },
            ]}
          >
            Your language preference will be
            {'\n'}
            applied across the app.
          </Text>

          <Image
            source={artwork.infoLeaf}
            resizeMode="contain"
            style={{
              width: 42 * scale,
              height: 42 * scale,
            }}
          />
        </View>

        {error && (
          <Text
            accessibilityRole="alert"
            style={styles.errorText}
          >
            We couldn’t save the previous
            preference. You can still continue.
          </Text>
        )}

        {/* No Back button — Language is first page */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save and Continue"
          accessibilityState={{
            disabled: saving,
            busy: saving,
          }}
          disabled={saving}
          onPress={() =>
            void saveAndContinue()
          }
          style={({ pressed }) => [
            styles.continueButton,

            {
              minHeight: 54 * scale,
              marginTop: 14 * scale,

              borderRadius:
                12 * scale,
            },

            saving &&
              styles.continueButtonDisabled,

            pressed &&
              !saving &&
              styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.continueButtonText,
              {
                fontSize:
                  17 * scale,
              },
            ]}
          >
            {saving
              ? 'Saving...'
              : 'Save & Continue'}
          </Text>

          {!saving && (
            <Text
              style={[
                styles.continueArrow,
                {
                  fontSize:
                    25 * scale,
                },
              ]}
            >
              →
            </Text>
          )}
        </Pressable>
      </View>

      {/* Footer quote */}
      <View
        pointerEvents="none"
        style={[
          styles.footerOverlay,
          {
            bottom:
              landscapeHeight -
              2 * scale,
          },
        ]}
      >
        <View style={styles.footerDivider}>
          <View style={styles.footerLine} />

          <Image
            source={artwork.dividerSprout}
            resizeMode="contain"
            style={{
              width: 46 * scale,
              height: 27 * scale,
              marginHorizontal:
                10 * scale,
            }}
          />

          <View style={styles.footerLine} />
        </View>

        <Text
          style={[
            styles.footerQuote,
            {
              fontSize:
                13 * scale,

              lineHeight:
                16 * scale,
            },
          ]}
        >
          {'“Better Farmers\nBrighter Tomorrows”'}
        </Text>
      </View>

      {/* Bottom farm artwork */}
      <Image
        pointerEvents="none"
        source={artwork.bottomLandscape}
        resizeMode="cover"
        fadeDuration={0}
        style={[
          styles.bottomLandscape,
          {
            height: landscapeHeight,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FCFBF5',
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    zIndex: 2,
    alignItems: 'center',
    paddingHorizontal: 26,
  },

  topLeftLeaves: {
    position: 'absolute',
    top: -10,
    left: -15,
    zIndex: 1,
    opacity: 0.96,
  },

  topRightLeaves: {
    position: 'absolute',
    top: -6,
    right: -17,
    zIndex: 1,
    opacity: 0.58,
  },

  heading: {
    width: '100%',
    marginTop: 3,

    textAlign: 'center',
    fontFamily: 'serif',
    fontWeight: '700',
  },

  headingDark: {
    color: '#102E35',
  },

  headingGreen: {
    color: '#176B35',
  },

  subtitle: {
    marginTop: 5,

    color: '#66717A',
    textAlign: 'center',
  },

  headerDivider: {
    width: '56%',

    flexDirection: 'row',
    alignItems: 'center',
  },

  headerDividerLine: {
    flex: 1,
    height: 1,

    backgroundColor: '#BFD1B4',
  },

  languageList: {
    width: '100%',
  },

  languageCard: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 9,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E4E7DF',

    shadowColor: '#273626',
    shadowOpacity: 0.11,
    shadowRadius: 7,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  languageCardSelected: {
    backgroundColor: '#F6FAF1',

    borderColor: '#3D8B4D',
    borderWidth: 1.5,
  },

  pressed: {
    opacity: 0.84,
  },

  languageIcon: {
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#EDF4E3',
  },

  languageSymbol: {
    color: '#12632F',
    fontWeight: '700',
  },

  globe: {
    width: 32,
    height: 32,

    borderRadius: 16,

    borderWidth: 2.2,
    borderColor: '#12632F',

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',
  },

  globeVertical: {
    position: 'absolute',

    width: 12,
    height: 30,

    borderLeftWidth: 2,
    borderRightWidth: 2,

    borderColor: '#12632F',

    borderRadius: 9,
  },

  globeHorizontal: {
    position: 'absolute',

    width: 30,
    height: 2,

    backgroundColor: '#12632F',
  },

  globeUpperArc: {
    position: 'absolute',
    top: 7,

    width: 28,
    height: 2,

    backgroundColor: '#12632F',
  },

  globeLowerArc: {
    position: 'absolute',
    bottom: 7,

    width: 28,
    height: 2,

    backgroundColor: '#12632F',
  },

  languageTextArea: {
    flex: 1,
  },

  languageTitle: {
    color: '#102E35',
    fontWeight: '700',
  },

  languageHelper: {
    marginTop: 2,
    color: '#6E7980',
  },

  radioOuter: {
    marginLeft: 10,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
  },

  radioSelected: {
    borderColor: '#12632F',
  },

  radioIdle: {
    borderColor: '#969EA3',
  },

  radioInner: {
    backgroundColor: '#1E7C3B',
  },

  infoCard: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#EEF4DB',
  },

  infoIcon: {
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1.7,
    borderColor: '#176B35',

    marginRight: 12,
  },

  infoIconText: {
    color: '#176B35',

    fontFamily: 'serif',
    fontWeight: '700',

    marginTop: -2,
  },

  infoText: {
    flex: 1,

    color: '#145C2D',
    fontWeight: '700',
  },

  errorText: {
    marginTop: 5,

    color: '#A04435',

    fontSize: 11,
    textAlign: 'center',
  },

  continueButton: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#176C35',

    shadowColor: '#173F25',
    shadowOpacity: 0.18,
    shadowRadius: 7,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  continueButtonDisabled: {
    opacity: 0.65,
  },

  continueButtonText: {
    color: '#FFFFFF',

    fontWeight: '800',
  },

  continueArrow: {
    marginLeft: 16,

    color: '#FFFFFF',

    fontWeight: '400',
  },

  footerOverlay: {
    position: 'absolute',

    left: 0,
    right: 0,

    zIndex: 3,

    alignItems: 'center',

    paddingHorizontal: 88,
  },

  footerDivider: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
  },

  footerLine: {
    flex: 1,
    height: 1,

    backgroundColor: '#9FB991',
  },

  footerQuote: {
    marginTop: -1,

    color: '#4E463C',

    fontWeight: '600',
    textAlign: 'center',
  },

  bottomLandscape: {
    position: 'absolute',

    left: 0,
    right: 0,
    bottom: 0,

    width: '100%',

    zIndex: 1,
  },
});