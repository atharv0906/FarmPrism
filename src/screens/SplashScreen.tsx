import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AgriculturalBackdrop } from '../components/AgriculturalBackdrop';
import { BrandMark } from '../components/PhaseOneUI';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <AgriculturalBackdrop />
      <StatusBar style="light" />

      <View style={styles.overlay} />

      <View style={styles.content}>
        <BrandMark />
        <Text style={styles.title}>Growing{`\n`}A Better Tomorrow</Text>
        <View style={styles.leaf} />

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <ActivityIndicator color="#FFFFFF" size="small" />
        <Text style={styles.message}>Initializing your farm journey...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5B35',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 48, 27, 0.12)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '700',
    lineHeight: 38,
    textAlign: 'center',
    marginTop: 18,
  },
  leaf: {
    backgroundColor: '#DFF7A5',
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 18,
    height: 30,
    marginTop: 14,
    transform: [{ rotate: '-35deg' }],
    width: 16,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 5,
    height: 9,
    marginTop: 42,
    overflow: 'hidden',
    width: 230,
  },
  progressFill: {
    backgroundColor: '#DFF7A5',
    borderRadius: 5,
    height: '100%',
    width: '58%',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 10,
    opacity: 0.9,
  },
});
