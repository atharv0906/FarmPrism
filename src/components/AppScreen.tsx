import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export function AppScreen({ children }: PropsWithChildren) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F4',
  },
});
