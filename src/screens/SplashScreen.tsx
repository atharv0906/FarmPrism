import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const artwork = {
  background: require(
    '../../assets/FarmPrism_Splash_Assets/farmprism_splash_background_1080x2340.png',
  ),

  logo: require(
    '../../assets/FarmPrism_Splash_Assets/farmprism_splash_logo_badge_1024.png',
  ),

  sprout: require(
    '../../assets/FarmPrism_Splash_Assets/farmprism_center_sprout.png',
  ),
};

const SEQUENCE_MS = 2790;
const LOADER_START_MS = 1875;

let splashStartedAt: number | undefined;
let splashCompleted = false;

const splashCompletionListeners = new Set<() => void>();

function subscribeToSplashCompletion(listener: () => void) {
  splashCompletionListeners.add(listener);

  return () => {
    splashCompletionListeners.delete(listener);
  };
}

function getSplashCompletionSnapshot() {
  return splashCompleted;
}

function getSplashElapsed() {
  if (splashCompleted) {
    return SEQUENCE_MS;
  }

  if (splashStartedAt === undefined) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(Date.now() - splashStartedAt, SEQUENCE_MS),
  );
}

function completeSplash() {
  if (splashCompleted) {
    return;
  }

  splashCompleted = true;

  splashCompletionListeners.forEach((listener) => {
    listener();
  });
}

export function useSplashCompleted() {
  return useSyncExternalStore(
    subscribeToSplashCompletion,
    getSplashCompletionSnapshot,
    getSplashCompletionSnapshot,
  );
}

export function SplashScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const unit = Math.min(width / 392, height / 850);

  const [timeline] = useState(
    () => new Animated.Value(getSplashElapsed()),
  );

  const loading = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    splashStartedAt ??= Date.now();

    const elapsed = getSplashElapsed();

    timeline.setValue(elapsed);

    const sequence = Animated.timing(timeline, {
      toValue: SEQUENCE_MS,
      duration: Math.max(0, SEQUENCE_MS - elapsed),
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    });

    sequence.start(({ finished }) => {
      if (finished) {
        completeSplash();
      }
    });

    loading.setValue(0);

    const loader = Animated.sequence([
      Animated.delay(
        Math.max(0, LOADER_START_MS - elapsed),
      ),

      Animated.loop(
        Animated.timing(loading, {
          toValue: 1,
          duration: 1150,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ),
    ]);

    loader.start();

    return () => {
      sequence.stop();
      loader.stop();
    };
  }, [timeline, loading]);

  const reveal = (
    start: number,
    end: number,
  ) =>
    timeline.interpolate({
      inputRange: [start, end],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

  const rise = (
    start: number,
    end: number,
    distance: number,
  ) =>
    timeline.interpolate({
      inputRange: [start, end],
      outputRange: [distance, 0],
      extrapolate: 'clamp',
    });

  const logoSize = Math.min(
    width * 0.44,
    190 * unit,
  );

  const logoTop = height * 0.20;

  /*
   * Lower content occupies roughly the bottom third
   * of the approved Splash composition.
   *
   * The bottom padding protects it from Android's
   * navigation area without moving the whole design.
   */
  const lowerBottom =
    Math.max(insets.bottom, 8) + 22 * unit;

  return (
    <View
      style={styles.container}
      accessibilityLabel="FarmPrism is starting"
      accessibilityState={{ busy: true }}
    >
      <StatusBar hidden />

      {/* Exact supplied farmland background */}
      <Image
        source={artwork.background}
        resizeMode="cover"
        fadeDuration={0}
        style={styles.background}
      />

      {/* Exact supplied FarmPrism logo */}
      <Animated.Image
        source={artwork.logo}
        resizeMode="contain"
        fadeDuration={0}
        accessibilityLabel="FarmPrism — from soil to sell"
        style={[
          styles.logo,
          {
            top: logoTop,
            left: (width - logoSize) / 2,
            width: logoSize,
            height: logoSize,

            opacity: reveal(250, 650),

            transform: [
              {
                scale: timeline.interpolate({
                  inputRange: [250, 650],
                  outputRange: [0.88, 1],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      />

      {/* Bottom content */}
      <View
        pointerEvents="none"
        style={[
          styles.lowerContent,
          {
            bottom: lowerBottom,
          },
        ]}
      >
        <Animated.Text
          accessibilityLabel="Growing A Better Tomorrow"
          maxFontSizeMultiplier={1.15}
          style={[
            styles.tagline,
            {
              fontSize: 31 * unit,
              lineHeight: 36 * unit,

              opacity: reveal(1200, 1600),

              transform: [
                {
                  translateY: rise(
                    1200,
                    1600,
                    10 * unit,
                  ),
                },
              ],
            },
          ]}
        >
          {'Growing\nA Better Tomorrow'}
        </Animated.Text>

        <Animated.View
          style={[
            styles.loaderSection,
            {
              opacity: reveal(1725, 2025),
            },
          ]}
        >
          {/* Same sprout asset, no hard-coded cropping */}
          <Image
            source={artwork.sprout}
            resizeMode="contain"
            fadeDuration={0}
            style={{
              width: 76 * unit,
              height: 76 * unit,
              marginBottom: 4 * unit,
            }}
          />

          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Initializing your farm journey"
            style={[
              styles.track,
              {
                width: 176 * unit,
                height: 4 * unit,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.loader,
                {
                  width: 74 * unit,

                  transform: [
                    {
                      translateX:
                        loading.interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            -74 * unit,
                            176 * unit,
                          ],
                        }),
                    },
                  ],
                },
              ]}
            />
          </View>

          <Text
            maxFontSizeMultiplier={1.15}
            style={[
              styles.loadingCaption,
              {
                fontSize: 12 * unit,
                marginTop: 12 * unit,
              },
            ]}
          >
            Initializing your farm journey...
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#173C22',
    overflow: 'hidden',
  },

  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  logo: {
    position: 'absolute',
  },

  lowerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  tagline: {
    width: '100%',
    textAlign: 'center',

    color: '#FFFDF0',

    fontWeight: '700',

    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),

    textShadowColor: 'rgba(28, 52, 31, 0.72)',
    textShadowOffset: {
      width: 0,
      height: 2,
    },
    textShadowRadius: 4,
  },

  loaderSection: {
    alignItems: 'center',
    marginTop: 14,
  },

  track: {
    overflow: 'hidden',
    borderRadius: 999,

    backgroundColor:
      'rgba(232, 246, 196, 0.52)',
  },

  loader: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#D8F49A',
  },

  loadingCaption: {
    color: '#FFFDEB',

    textShadowColor:
      'rgba(24, 48, 28, 0.72)',

    textShadowOffset: {
      width: 0,
      height: 1,
    },

    textShadowRadius: 3,
  },
});