import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const artwork = {
  background: require('../../assets/FarmPrism_Splash_Assets/farmprism_splash_background_1080x2340.png'),
  badge: require('../../assets/FarmPrism_Splash_Assets/farmprism_splash_logo_badge_1024.png'),
  sprout: require('../../assets/FarmPrism_Splash_Assets/farmprism_center_sprout.png'),
};

// Launch-scoped state only moves forward, including across provider updates/remounts.
const SEQUENCE_MS = 2790;
const LOADER_START_MS = 1875;
let splashStartedAt: number | undefined;
let splashCompleted = false;
const splashCompletionListeners = new Set<() => void>();

function subscribeToSplashCompletion(listener: () => void) {
  splashCompletionListeners.add(listener);
  return () => splashCompletionListeners.delete(listener);
}

function getSplashCompletionSnapshot() {
  return splashCompleted;
}

function getSplashElapsed() {
  if (splashCompleted) return SEQUENCE_MS;
  if (splashStartedAt === undefined) return 0;
  return Math.max(0, Math.min(Date.now() - splashStartedAt, SEQUENCE_MS));
}

function completeSplash() {
  if (splashCompleted) return;
  splashCompleted = true;
  splashCompletionListeners.forEach(listener => listener());
}

export function useSplashCompleted() {
  return useSyncExternalStore(subscribeToSplashCompletion, getSplashCompletionSnapshot, getSplashCompletionSnapshot);
}

export function SplashScreen() {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState({ width: window.width, height: window.height });
  const { width, height } = layout;
  const unit = Math.min(width / 392, height / 850);
  // Initialize at the launch position before the first render of a remount.
  const [timeline] = useState(() => new Animated.Value(getSplashElapsed()));
  const loading = useRef(new Animated.Value(0)).current;
  const [lowerContentHeight, setLowerContentHeight] = useState(0);
  // Keep the reference position when space permits; move only the lower group
  // when its measured content would enter the system navigation area.
  const lowerContentBottom = Math.max(
    insets.bottom + 16 * unit,
    height * 0.285 - lowerContentHeight,
  );

  useEffect(() => {
    splashStartedAt ??= Date.now();
    const elapsed = getSplashElapsed();
    timeline.setValue(elapsed);
    const sequence = Animated.timing(timeline, {
      toValue: SEQUENCE_MS,
      duration: SEQUENCE_MS - elapsed,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    });
    sequence.start(({ finished }) => {
      if (finished) completeSplash();
    });

    // Independent of visual completion: keep moving while restoration is pending.
    loading.setValue(0);
    const loader = Animated.sequence([
      Animated.delay(Math.max(0, LOADER_START_MS - elapsed)),
      Animated.loop(Animated.timing(loading, {
        toValue: 1,
        duration: 1150,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })),
    ]);
    loader.start();
    return () => {
      sequence.stop();
      loader.stop();
    };
  }, [timeline, loading]);

  const reveal = (start: number, end: number) => timeline.interpolate({
    inputRange: [start, end], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const entrance = (start: number, end: number, distance: number) => timeline.interpolate({
    inputRange: [start, end], outputRange: [distance * unit, 0], extrapolate: 'clamp',
  });
  // The complete supplied badge includes transparent margins around its seal.
  const badgeSize = 180 * unit;

  return (
    <View style={styles.container} accessibilityLabel="FarmPrism is starting" accessibilityState={{ busy: true }}
      onLayout={({ nativeEvent }) => setLayout(nativeEvent.layout)}>
      <StatusBar hidden />
      <Image source={artwork.background} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Animated.View style={[styles.badge, {
        top: height * 0.305 - badgeSize / 2, width: badgeSize, height: badgeSize,
        opacity: reveal(250, 625),
        transform: [{ scale: timeline.interpolate({ inputRange: [250, 625], outputRange: [0.86, 1], extrapolate: 'clamp' }) }],
      }]}>
        <Image source={artwork.badge} accessibilityLabel="FarmPrism — from soil to sell"
          resizeMode="contain" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={[styles.lowerContent, { bottom: lowerContentBottom }]}
        onLayout={({ nativeEvent }) => setLowerContentHeight(nativeEvent.layout.height)}>
      <Animated.Text accessibilityLabel="Growing A Better Tomorrow" maxFontSizeMultiplier={1.2} style={[styles.tagline, {
        fontSize: 32 * unit, lineHeight: 36 * unit,
        opacity: reveal(1250, 1625), transform: [{ translateY: entrance(1250, 1625, 9) }],
      }]}>
        {'Growing\nA Better Tomorrow'}
      </Animated.Text>
      <Animated.View style={[styles.loadingArea, {
        marginTop: 8 * unit, opacity: reveal(1750, 2000),
      }]}>
        {/* Clip the transparent sprout canvas to its central artwork. */}
        <View style={{ width: 32 * unit, height: 28 * unit, overflow: 'hidden', marginBottom: 12 * unit }}>
          <Image source={artwork.sprout} resizeMode="contain" style={{
            position: 'absolute', width: 134 * unit, height: 134 * unit, left: -57.5 * unit, top: -61.5 * unit,
          }} />
        </View>
        <View accessibilityRole="progressbar" accessibilityLabel="Initializing your farm journey" style={[styles.track, {
          width: 176 * unit, height: 4 * unit,
        }]}>
          <Animated.View style={[styles.loader, {
            width: 74 * unit,
            transform: [{ translateX: loading.interpolate({ inputRange: [0, 1], outputRange: [-74 * unit, 176 * unit] }) }],
          }]} />
        </View>
        <Text maxFontSizeMultiplier={1.2} style={[styles.loadingCaption, { fontSize: 12 * unit, marginTop: 12 * unit }]}>
          Initializing your farm journey...
        </Text>
      </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#294E26', alignItems: 'center', overflow: 'hidden' },
  badge: { position: 'absolute' },
  lowerContent: { position: 'absolute', width: '100%', alignItems: 'center' },
  tagline: {
    width: '100%', textAlign: 'center', color: '#fffef2', fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: '#203b22', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  loadingArea: { alignItems: 'center' },
  track: { overflow: 'hidden', borderRadius: 3, backgroundColor: 'rgba(237, 249, 197, 0.55)' },
  loader: { height: '100%', backgroundColor: '#d5f49b', borderRadius: 3 },
  loadingCaption: { color: '#fffde8', textShadowColor: '#203b22', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
});
