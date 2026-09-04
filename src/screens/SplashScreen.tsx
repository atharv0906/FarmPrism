import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FarmPrism</Text>
      <ActivityIndicator color="#23412D" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#F7F9F4',
  },
  title: {
    color: '#23412D',
    fontSize: 28,
    fontWeight: '700',
  },
});
