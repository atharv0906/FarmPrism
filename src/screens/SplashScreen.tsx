import { ImageBackground, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const splashImage = require('../../assets/splash_reference.png');

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={splashImage}
        resizeMode="cover"
        fadeDuration={0}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#294E26',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
