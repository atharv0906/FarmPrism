import { StyleSheet, Text, View } from 'react-native';

export function ArchitecturePlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FarmPrism</Text>
      <Text style={styles.message}>Frontend architecture is ready for feature implementation.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F9F4',
  },
  title: {
    color: '#23412D',
    fontSize: 28,
    fontWeight: '700',
  },
  message: {
    marginTop: 12,
    color: '#53645A',
    fontSize: 16,
    textAlign: 'center',
  },
});
