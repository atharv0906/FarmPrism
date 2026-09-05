import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const splashImage = require('../../assets/splash_reference.png');
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 2340;
const DESIGN_ASPECT_RATIO = DESIGN_WIDTH / DESIGN_HEIGHT;

export function SplashScreen() {
  const insets = useSafeAreaInsets();
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const backgroundScale = useRef(new Animated.Value(1.03)).current;
  const loaderPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const backgroundAnimation = Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(backgroundScale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    const loaderAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(loaderPulse, {
          toValue: 1.04,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(loaderPulse, {
          toValue: 1,
          duration: 450,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const timeline = Animated.sequence([
      backgroundAnimation,
      Animated.delay(200),
    ]);

    timeline.start();
    loaderAnimation.start();

    return () => {
      timeline.stop();
      loaderAnimation.stop();
    };
  }, [backgroundOpacity, backgroundScale, loaderPulse]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <View style={styles.frame}>
        <Animated.View
          style={[
            styles.imageWrap,
            {
              opacity: backgroundOpacity,
              transform: [{ scale: backgroundScale }],
            },
          ]}
        >
          <ImageBackground
            source={splashImage}
            resizeMode="cover"
            fadeDuration={0}
            style={styles.image}
          />

          <View pointerEvents="none" style={styles.loaderMask}>
            <Animated.Image
              source={splashImage}
              resizeMode="cover"
              style={[
                styles.loaderImage,
                {
                  transform: [{ scale: loaderPulse }],
                  opacity: 1,
                },
              ]}
            />
          </View>
        </Animated.View>
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
    paddingBottom: 0,
  },
  imageWrap: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderMask: {
    position: 'absolute',
    left: '22%',
    right: '22%',
    bottom: '9.5%',
    height: 18,
    overflow: 'hidden',
  },
  loaderImage: {
    width: '100%',
    height: '100%',
  },
});
