import { useSyncExternalStore } from 'react';
import { useEventListener } from 'expo';
import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const splashVideo = require('../../assets/2. Splash screen animation.mp4');
const VIDEO_ASPECT_RATIO = 392 / 850;

let splashVideoCompleted = false;
const splashCompletionListeners = new Set<() => void>();

function subscribeToSplashCompletion(listener: () => void) {
  splashCompletionListeners.add(listener);
  return () => splashCompletionListeners.delete(listener);
}

function getSplashCompletionSnapshot() {
  return splashVideoCompleted;
}

function beginSplashPlayback() {
  splashVideoCompleted = false;
  splashCompletionListeners.forEach(listener => listener());
}

function completeSplashPlayback() {
  if (splashVideoCompleted) return;
  splashVideoCompleted = true;
  splashCompletionListeners.forEach(listener => listener());
}

export function useSplashVideoCompleted() {
  return useSyncExternalStore(subscribeToSplashCompletion, getSplashCompletionSnapshot, getSplashCompletionSnapshot);
}

export function SplashScreen() {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(splashVideo, (player) => {
    beginSplashPlayback();
    player.loop = false;
    player.muted = true;
    player.play();
  });
  useEventListener(player, 'playToEnd', completeSplashPlayback);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <View style={styles.videoFrame}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#294E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoFrame: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    aspectRatio: VIDEO_ASPECT_RATIO,
    backgroundColor: '#294E26',
  },
});
