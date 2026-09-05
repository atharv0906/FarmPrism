    import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const splashImage = require('../../assets/splash_reference.png');
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 2340;
const DESIGN_ASPECT_RATIO = DESIGN_WIDTH / DESIGN_HEIGHT;

export function SplashScreen() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmer]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.frame}>
        <ImageBackground
          source={splashImage}
          resizeMode="cover"
          fadeDuration={0}
          style={styles.image}
        >
          <View pointerEvents="none" style={styles.loaderRegion}>
            <Animated.View
              style={[
                styles.loaderHighlight,
                {
                  opacity: shimmer.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.12, 0.6, 0.12],
                  }),
                  transform: [
                    {
                      translateX: shimmer.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 30],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </ImageBackground>
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
  frame: {
    width: '100%',
    maxHeight: '100%',
    aspectRatio: DESIGN_ASPECT_RATIO,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderRegion: {
    position: 'absolute',
    left: '26%',
    right: '26%',
    bottom: '11%',
    height: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loaderHighlight: {
    width: '26%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
