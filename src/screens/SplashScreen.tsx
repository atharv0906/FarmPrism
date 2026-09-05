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
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const backgroundScale = useRef(new Animated.Value(1.03)).current;
  const loaderSweep = useRef(new Animated.Value(-1)).current;

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
        Animated.timing(loaderSweep, {
          toValue: 1,
          duration: 850,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(loaderSweep, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const timeline = Animated.sequence([
      backgroundAnimation,
      Animated.delay(250),
    ]);

    timeline.start();
    loaderAnimation.start();

    return () => {
      timeline.stop();
      loaderAnimation.stop();
    };
  }, [backgroundOpacity, backgroundScale, loaderSweep]);

  const loaderTranslate = loaderSweep.interpolate({
    inputRange: [-1, 1],
    outputRange: [-110, 110],
  });

  return (
    <View style={styles.container}>
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

          <Animated.View
            pointerEvents="none"
            style={[
              styles.loaderSweep,
              {
                transform: [{ translateX: loaderTranslate }],
              },
            ]}
          />
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
  loaderSweep: {
    position: 'absolute',
    left: '24%',
    right: '24%',
    bottom: '9.5%',
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    opacity: 0.42,
  },
});
