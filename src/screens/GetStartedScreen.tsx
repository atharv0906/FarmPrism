import { useEffect, useRef, useState } from 'react';
import {
  Alert, FlatList, Image, Platform, Pressable, StyleSheet, Text, View,
  useWindowDimensions, type ImageSourcePropType,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

const artwork = {
  logo: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_farmprism_logo.png'),
  leftLeaves: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_top_left_leaves.png'),
  rightLeaves: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_top_right_leaves.png'),
  landscape: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_bottom_landscape.png'),
  farmer: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_farmer_portrait.png'),
  crate: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_farmer_produce_crate.png'),
  phone: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_produce_phone.png'),
  plant: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_sprouting_plant.png'),
  community: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_team_network.png'),
  roles: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_team_roles.png'),
  farmersQuote: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_quote_better_farmers.png'),
  marketsQuote: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_quote_better_markets.png'),
  togetherQuote: require('../../assets/3. FarmPrism_Get_started_Assets/getstarted_together_tomorrow.png'),
};
const pages = [0, 1, 2, 3];
const subtitles = [
  'From Soil to Sell, We Grow Together.',
  'Track your crops, monitor progress\nand get insights to improve yield\nand quality.',
  'Connect directly with buyers, explore\nlive market rates and get the best\nvalue for your produce.',
  'Join a trusted community of\nfarmers, FPOs, buyers and partners\nfor a sustainable future.',
];
const features = [
  { image: artwork.farmer, title: 'Sell directly to verified buyers', description: 'Get better prices for your hard work.' },
  { image: artwork.plant, title: 'Manage your crops with ease', description: 'Track, update and grow your produce.' },
  { image: artwork.community, title: 'Be part of a trusted farming community', description: 'Together for a prosperous tomorrow.' },
];
// Approved onboarding examples, not a live market feed.
const marketRows = [
  { icon: '🍅', crop: 'Tomato', price: '₹1,420', movement: '↑ 2.5%', down: false },
  { icon: '🧅', crop: 'Onion', price: '₹1,980', movement: '↓ 1.3%', down: true },
  { icon: '🌾', crop: 'Wheat', price: '₹2,183', movement: '↑ 3.1%', down: false },
  { icon: '🫛', crop: 'Soybean', price: '₹3,200', movement: '↑ 0.8%', down: false },
];

function Art({ source, width, height, label }: {
  source: ImageSourcePropType; width: number; height: number; label?: string;
}) {
  return <Image source={source} resizeMode="contain" fadeDuration={0}
    accessibilityLabel={label} accessible={!!label} style={{ width, height }} />;
}

function Heading({ page, scale: s }: { page: number; scale: number }) {
  const titleStyle = [styles.heading, { fontSize: (page === 3 ? 32 : 36) * s, lineHeight: 40 * s }];
  return (
    <Text maxFontSizeMultiplier={1.05} style={titleStyle}>
      {page === 0 ? <><Text style={styles.navy}>Welcome to</Text>{'\n'}<Text style={{ fontSize: 46 * s, lineHeight: 49 * s }}><Text style={styles.green}>Farm</Text><Text style={styles.brown}>Prism</Text></Text></>
        : page === 1 ? <><Text style={styles.green}>Grow Smarter</Text>{'\n'}<Text style={styles.brown}>Every Season</Text></>
        : page === 2 ? <><Text style={styles.navy}>Fair Prices</Text>{'\n'}<Text style={{ color: '#155c30', fontSize: 34 * s }}>Real Opportunities</Text></>
        : <><Text style={styles.navy}>Stronger </Text><Text style={styles.green}>Together</Text></>}
    </Text>
  );
}

function FeatureCards({ scale: s }: { scale: number }) {
  return <View style={{ gap: 8 * s, width: 342 * s }}>
    {features.map(feature => <View key={feature.title} style={[styles.featureCard, { height: 104 * s, borderRadius: 13 * s }]}>
      <Art source={feature.image} width={157 * s} height={102 * s} />
      <View style={[styles.featureCopy, { paddingRight: 10 * s }]}>
        <Text maxFontSizeMultiplier={1.05} style={[styles.featureTitle, { fontSize: 16 * s, lineHeight: 19 * s }]}>{feature.title}</Text>
        <Text maxFontSizeMultiplier={1.05} style={[styles.featureDescription, { fontSize: 13.5 * s, lineHeight: 16 * s, marginTop: 7 * s }]}>{feature.description}</Text>
      </View>
    </View>)}
  </View>;
}

function MarketCard({ scale: s }: { scale: number }) {
  return <View style={[styles.marketCard, { width: 205 * s, borderRadius: 11 * s, padding: 8 * s }]}>
    <View style={[styles.marketHeader, { paddingBottom: 8 * s }]}>
      <Text maxFontSizeMultiplier={1.05} style={[styles.marketTitle, { fontSize: 13 * s }]}>Live Market Price</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="View all market prices" hitSlop={6}
        onPress={() => Alert.alert('Coming Soon')}>
        <Text maxFontSizeMultiplier={1.05} style={{ color: '#176b35', fontSize: 9 * s }}>View All →</Text>
      </Pressable>
    </View>
    {marketRows.map(row => <View key={row.crop} style={[styles.marketRow, { height: 43 * s }]}>
      <Text style={{ fontSize: 21 * s, width: 30 * s }} accessible={false}>{row.icon}</Text>
      <Text maxFontSizeMultiplier={1.05} style={{ fontSize: 10 * s, width: 45 * s, color: '#18352e' }}>{row.crop}</Text>
      <View style={{ flex: 1 }}>
        <Text maxFontSizeMultiplier={1.05} style={{ fontSize: 9 * s, color: '#183044' }}>
          <Text style={{ fontWeight: '700', fontSize: 11 * s }}>{row.price}</Text> / quintal
        </Text>
        <Text maxFontSizeMultiplier={1.05} style={{ color: row.down ? '#d63729' : '#168333', fontSize: 11 * s, fontWeight: '700', marginTop: 3 * s }}>{row.movement}</Text>
      </View>
    </View>)}
  </View>;
}

function PageContent({ page, scale: s }: { page: number; scale: number }) {
  if (page === 0) return <>
    <FeatureCards scale={s} />
    {/* Quote canvases are 3:1 with internal transparent margins; size the whole PNG accordingly. */}
    <Art source={artwork.farmersQuote} width={270 * s} height={90 * s} label="Better Farmers, Brighter Tomorrows" />
  </>;
  if (page === 1) return <View style={{ alignSelf: 'flex-end', marginRight: -8 * s }}>
    <Art source={artwork.phone} width={300 * s} height={300 * 1448 / 1086 * s} />
  </View>;
  if (page === 2) return <>
    <View style={{ width: 392 * s, height: 306 * s }}>
      <View style={{ position: 'absolute', left: -12 * s, bottom: -8 * s }}>
        <Art source={artwork.crate} width={238 * s} height={238 * 1402 / 1122 * s} />
      </View>
      <View style={{ position: 'absolute', right: 18 * s, top: 8 * s }}><MarketCard scale={s} /></View>
    </View>
    <Art source={artwork.marketsQuote} width={270 * s} height={90 * s} label="Better Markets, Brighter Tomorrows" />
  </>;
  return <>
    <Art source={artwork.roles} width={302 * s} height={302 * s} label="FarmPrism community network" />
    <Art source={artwork.togetherQuote} width={306 * s} height={102 * s} label="Together, We Build a Better Tomorrow" />
  </>;
}

export function GetStartedScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'GetStarted'>) {
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState({ width: dimensions.width, height: dimensions.height });
  const { width, height } = viewport;
  const list = useRef<FlatList<number>>(null);
  const currentPage = useRef(0);
  // Reference composition: 754 units of illustration/content + a 96-unit footer.
  // Fit the entire composition to the measured app viewport, excluding system insets.
  // There is no minimum scale that could force content under a smaller device's footer.
  const s = Math.min(width / 392, (height - insets.top - insets.bottom) / 850);
  const footerHeight = 96 * s + insets.bottom;
  const contentHeight = height - footerHeight;
  const compositionTop = insets.top + Math.max(0, (contentHeight - insets.top - 754 * s) / 2);
  const headerHeight = [286, 306, 306, 270];

  useEffect(() => {
    list.current?.scrollToOffset({ offset: currentPage.current * width, animated: false });
  }, [width]);

  const goToPage = (page: number) => {
    const target = Math.max(0, Math.min(3, page));
    currentPage.current = target;
    list.current?.scrollToOffset({ offset: target * width, animated: true });
  };

  return <View style={styles.root} onLayout={({ nativeEvent }) => setViewport(nativeEvent.layout)}>
    <StatusBar hidden />
    <FlatList ref={list} data={pages} horizontal pagingEnabled bounces={false} overScrollMode="never"
      initialNumToRender={4} windowSize={5} showsHorizontalScrollIndicator={false}
      keyExtractor={page => String(page)} extraData={`${width}:${height}:${insets.bottom}:${insets.top}`}
      getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      onMomentumScrollEnd={({ nativeEvent }) => { currentPage.current = Math.round(nativeEvent.contentOffset.x / width); }}
      renderItem={({ item: page }) => <View style={{ width, height, backgroundColor: '#fffef5' }}>
        <View style={[styles.content, { height: contentHeight + 24 * s }]}>
          <Image source={artwork.leftLeaves} resizeMode="contain" fadeDuration={0}
            style={{ position: 'absolute', top: -7 * s, left: -8 * s, width: 125 * s, height: 165 * s }} />
          <Image source={artwork.rightLeaves} resizeMode="contain" fadeDuration={0}
            style={{ position: 'absolute', top: -7 * s, right: -8 * s, width: 125 * s, height: 165 * s }} />
          {/* The 3:1 landscape is deliberately taller than its width-fit size. Cover
              preserves its aspect ratio; only peripheral edges are cropped. The
              transparent sky blends behind the quote, never over the cards/text. */}
          <Image source={artwork.landscape} resizeMode="cover" fadeDuration={0}
            style={{ position: 'absolute', width, height: 210 * s, bottom: 0 }} />
          <View style={{ width: 392 * s, alignItems: 'center', marginTop: compositionTop }}>
            <View style={{ height: headerHeight[page] * s, alignItems: 'center', width: '100%', paddingTop: 34 * s }}>
              <Art source={artwork.logo} width={112 * s} height={112 * s} label="FarmPrism" />
              <View style={{ marginTop: 9 * s, width: '100%' }}><Heading page={page} scale={s} /></View>
              <Text maxFontSizeMultiplier={1.05} style={[styles.subtitle, {
                fontSize: (page === 0 ? 15.5 : 16) * s, lineHeight: 20 * s,
                marginTop: 8 * s, width: (page === 0 ? 360 : 324) * s,
              }]}>{subtitles[page]}</Text>
            </View>
            <PageContent page={page} scale={s} />
          </View>
        </View>
        <View style={[styles.footer, { height: footerHeight, paddingBottom: insets.bottom + 12 * s,
          paddingHorizontal: Math.max(22 * s, insets.left, insets.right), paddingTop: 5 * s,
          borderTopLeftRadius: 42 * s, borderTopRightRadius: 42 * s }]}>
          <View style={[styles.dots, { height: 28 * s }]}>
            {pages.map(dot => <Pressable key={dot} accessibilityRole="button" accessibilityLabel={`Go to introduction page ${dot + 1}`}
              accessibilityState={{ selected: dot === page }} onPress={() => goToPage(dot)}
              style={{ width: 22 * s, height: 28 * s, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 10 * s, height: 10 * s, borderRadius: 5 * s, backgroundColor: dot === page ? '#176b35' : '#c3d2b9' }} />
            </Pressable>)}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={page === 3 ? 'Get Started' : 'Next'}
            onPress={() => page === 3 ? navigation.navigate('PhoneLogin') : goToPage(page + 1)}
            style={({ pressed }) => [styles.button, { height: 46 * s, borderRadius: 10 * s, marginTop: 3 * s }, pressed && styles.pressed]}>
            <Text maxFontSizeMultiplier={1.2} style={{ color: '#fff', fontSize: 17 * s, fontWeight: '600' }}>{page === 3 ? 'Get Started' : 'Next'}</Text>
            <Text accessible={false} style={{ color: '#fff', fontSize: 25 * s, marginLeft: 14 * s }}>→</Text>
          </Pressable>
        </View>
      </View>} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fffef5' },
  content: { alignItems: 'center', overflow: 'hidden' },
  heading: { textAlign: 'center', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), fontWeight: '700', includeFontPadding: false },
  navy: { color: '#0b293b' }, green: { color: '#14592d' }, brown: { color: '#74300e' },
  subtitle: { color: '#4b5c69', textAlign: 'center', includeFontPadding: false },
  featureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f6e5', borderWidth: 1, borderColor: '#e5ebd8',
    shadowColor: '#6a8045', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  featureCopy: { flex: 1 },
  featureTitle: { color: '#155d2b', fontWeight: '700', includeFontPadding: false },
  featureDescription: { color: '#5f6b70', includeFontPadding: false },
  marketCard: { backgroundColor: '#fff', shadowColor: '#637344', shadowOpacity: 0.14, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  marketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marketTitle: { fontWeight: '700', color: '#0a5239' },
  marketRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#edf0e8' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  button: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#216733' },
  pressed: { opacity: 0.86 },
});
