import { Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image source={require('../../assets/farmprism-ui/splash_reference.jpg')} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  image: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
});
