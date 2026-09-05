import { StyleSheet, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const splashVideo = require('../../assets/Splash screen animation.mp4');
const VIDEO_ASPECT_RATIO = 392 / 850;

export function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <View style={styles.videoFrame}>
        <Video
          source={splashVideo}
          shouldPlay
          isMuted
          isLooping={false}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
          style={styles.video}
          accessibilityIgnoresInvertColors
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
