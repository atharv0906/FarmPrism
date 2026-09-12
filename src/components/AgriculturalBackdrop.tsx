import { StyleSheet, View } from 'react-native';

export function AgriculturalBackdrop({ dim = false }: { dim?: boolean }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scene, dim && styles.dim]}>
      <View style={styles.sky} />
      <View style={styles.sun} />
      <View style={styles.farHill} />
      <View style={styles.nearHill} />
      <View style={styles.fieldBack} />
      <View style={styles.fieldMid} />
      <View style={styles.fieldFront} />
      <View style={[styles.crop, styles.cropLeft]} />
      <View style={[styles.crop, styles.cropRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: '#B8D7E0', overflow: 'hidden' },
  dim: { opacity: 0.42 },
  sky: { backgroundColor: '#F4D49F', height: '58%', left: 0, position: 'absolute', right: 0, top: 0 },
  sun: { backgroundColor: '#FFF3BF', borderRadius: 70, height: 110, position: 'absolute', right: '14%', top: '30%', width: 110 },
  farHill: { backgroundColor: '#819B83', borderTopLeftRadius: 180, borderTopRightRadius: 180, bottom: '39%', height: '20%', left: '-22%', position: 'absolute', transform: [{ rotate: '-7deg' }], width: '90%' },
  nearHill: { backgroundColor: '#52745A', borderTopLeftRadius: 220, borderTopRightRadius: 220, bottom: '31%', height: '17%', position: 'absolute', right: '-28%', transform: [{ rotate: '8deg' }], width: '100%' },
  fieldBack: { backgroundColor: '#789B59', bottom: '17%', height: '26%', left: 0, position: 'absolute', right: 0, transform: [{ skewY: '-5deg' }] },
  fieldMid: { backgroundColor: '#4F813E', bottom: 0, height: '28%', left: 0, position: 'absolute', right: 0, transform: [{ skewY: '7deg' }] },
  fieldFront: { backgroundColor: '#275B35', bottom: '-8%', height: '25%', left: 0, position: 'absolute', right: 0, transform: [{ skewY: '-10deg' }] },
  crop: { backgroundColor: '#9DBD55', borderRadius: 18, bottom: '4%', height: '28%', position: 'absolute', width: 18 },
  cropLeft: { left: '10%', transform: [{ rotate: '-24deg' }] },
  cropRight: { right: '9%', transform: [{ rotate: '23deg' }] },
});
