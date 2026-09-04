import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '../components/PhaseOneUI';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <BrandMark />
      <Text style={styles.title}>Growing{`\n`}A Better Tomorrow</Text>
      <Text style={styles.leaf}>⌁</Text>
      <ActivityIndicator color="#DFF7A5" size="large" />
      <Text style={styles.message}>Initializing your farm journey...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: '#2D5B35',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'center',
  },
  leaf: { color: '#DFF7A5', fontSize: 36 },
  message: { color: '#FFFFFF', fontSize: 15, opacity: 0.9 },
});
