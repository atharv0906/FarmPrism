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
      const progress = useRef(new Animated.Value(0)).current;

      useEffect(() => {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(progress, {
              toValue: 1,
              duration: 700,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(progress, {
              toValue: 0,
              duration: 700,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
        );

        animation.start();

        return () => {
          animation.stop();
        };
      }, [progress]);

      const loaderWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['8%', '100%'],
      });

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
              <View pointerEvents="none" style={styles.loaderContainer}>
                <View style={styles.loaderTrack}>
                  <Animated.View style={[styles.loaderFill, { width: loaderWidth }]} />
                </View>
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
      loaderContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 52,
        alignItems: 'center',
      },
      loaderTrack: {
        width: '48%',
        maxWidth: 220,
        height: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
      },
      loaderFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#F4F0E2',
      },
    });
