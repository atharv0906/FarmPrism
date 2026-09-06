import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const artwork = {
  background: require('../../assets/FarmPrism_Splash_Assets/farmprism_splash_background_1080x2340.png'),
  badge: require('../../assets/FarmPrism_Splash_Assets/farmprism_splash_logo_badge_1024.png'),
  sprout: require('../../assets/FarmPrism_Splash_Assets/farmprism_center_sprout.png'),
  left: require('../../assets/FarmPrism_Splash_Assets/farmprism_leaf_cluster_left.png'),
  right: require('../../assets/FarmPrism_Splash_Assets/farmprism_leaf_cluster_right.png'),
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
  const { width, height, fontScale } = useWindowDimensions();
  const unit = Math.min(width / 392, height / 850);
  // Initialize at the launch position before the first render of a remount.
  const [timeline] = useState(() => new Animated.Value(getSplashElapsed()));
  const loading = useRef(new Animated.Value(0)).current;
  const loaderTop = Math.max(
    height * 0.80,
    height * 0.715 + (72 * Math.min(fontScale, 1.2) + 8) * unit,
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
  const badgeSize = 144 * unit;

  return (
    <View style={styles.container} accessibilityLabel="FarmPrism is starting" accessibilityState={{ busy: true }}>
      <StatusBar hidden />
      <Image source={artwork.background} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Animated.View pointerEvents="none" style={[styles.leaves, {
        left: -18 * unit, bottom: 18 * unit, width: 110 * unit, height: 190 * unit,
        opacity: reveal(125, 625), transform: [{ translateX: entrance(125, 625, -24) }],
      }]}>
        <Image source={artwork.left} style={{ width: 220 * unit, height: 220 * unit, left: -30 * unit }} resizeMode="contain" />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.leaves, {
        right: -18 * unit, bottom: 18 * unit, width: 110 * unit, height: 190 * unit,
        opacity: reveal(125, 625), transform: [{ translateX: entrance(125, 625, 24) }],
      }]}>
        <Image source={artwork.right} style={{ width: 220 * unit, height: 220 * unit, left: -105 * unit }} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[styles.badge, {
        top: height * 0.305 - badgeSize / 2, width: badgeSize, height: badgeSize,
        borderRadius: badgeSize / 2, opacity: reveal(250, 625),
        transform: [{ scale: timeline.interpolate({ inputRange: [250, 625], outputRange: [0.86, 1], extrapolate: 'clamp' }) }],
      }]}>
        {/* Crop to the supplied emblem, excluding its baked wordmark/checkerboard margin. */}
        <View style={{ width: 94 * unit, height: 80 * unit, overflow: 'hidden', marginTop: 19 * unit }}>
          <Image source={artwork.badge} resizeMode="contain" style={{
            position: 'absolute', width: 194 * unit, height: 194 * unit, left: -62 * unit, top: -46 * unit,
          }} />
        </View>
        <Animated.Text maxFontSizeMultiplier={1.2} style={[styles.brand, { fontSize: 22 * unit, opacity: reveal(375, 750) }]}>
          FarmPrism
        </Animated.Text>
      </Animated.View>
      <Animated.Text accessibilityLabel="Growing A Better Tomorrow" maxFontSizeMultiplier={1.2} style={[styles.tagline, {
        top: height * 0.715, fontSize: 32 * unit, lineHeight: 36 * unit,
        opacity: reveal(1250, 1625), transform: [{ translateY: entrance(1250, 1625, 9) }],
      }]}>
        {'Growing\nA Better Tomorrow'}
      </Animated.Text>
      <Animated.View style={[styles.loadingArea, {
        top: loaderTop, opacity: reveal(1750, 2000),
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#294E26', alignItems: 'center', overflow: 'hidden' },
  leaves: { position: 'absolute', overflow: 'hidden' },
  badge: { position: 'absolute', backgroundColor: '#fffef5', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#e3e8cc' },
  brand: { color: '#195632', fontWeight: '700', letterSpacing: -0.7 },
  tagline: {
    position: 'absolute', width: '100%', textAlign: 'center', color: '#fffef2', fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    textShadowColor: '#203b22', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  loadingArea: { position: 'absolute', alignItems: 'center' },
  track: { overflow: 'hidden', borderRadius: 3, backgroundColor: 'rgba(237, 249, 197, 0.55)' },
  loader: { height: '100%', backgroundColor: '#d5f49b', borderRadius: 3 },
  loadingCaption: { color: '#fffde8', textShadowColor: '#203b22', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
});
