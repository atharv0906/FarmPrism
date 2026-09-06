import { useEffect, useRef, useState } from 'react';
import {
  FlatList, Image, Platform, Pressable, StyleSheet, Text, View,
  useWindowDimensions, type ViewStyle,
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

type ArtName = keyof typeof artwork;
type Box = readonly [x: number, y: number, width: number, height: number];
type ArtBounds = { size: readonly [number, number]; visible: Box };
// Native PNG sizes and non-transparent bounds. These are measurement metadata;
// no artwork is resized or rewritten. Quote padding must not shrink its lettering.
const artBounds: Record<ArtName, ArtBounds> = {
  logo: { size: [1254, 1254], visible: [0, 0, 1222, 1214] },
  leftLeaves: { size: [1254, 1254], visible: [0, 0, 1228, 1254] },
  rightLeaves: { size: [1254, 1254], visible: [39, 0, 1215, 1214] },
  landscape: { size: [2172, 724], visible: [0, 25, 2172, 699] },
  farmer: { size: [1448, 1086], visible: [0, 30, 1392, 1056] },
  crate: { size: [1122, 1402], visible: [0, 21, 1122, 1349] },
  phone: { size: [1086, 1448], visible: [0, 5, 1086, 1443] },
  plant: { size: [1448, 1086], visible: [0, 21, 1428, 1041] },
  community: { size: [1448, 1086], visible: [0, 17, 1432, 1069] },
  roles: { size: [1254, 1254], visible: [0, 5, 1236, 1249] },
  farmersQuote: { size: [2172, 724], visible: [447, 70, 1427, 628] },
  marketsQuote: { size: [2172, 724], visible: [276, 47, 1550, 653] },
  togetherQuote: { size: [2172, 724], visible: [114, 59, 1927, 649] },
};

const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 2340;
// Native comparison: the visible clouds trail the master by about 105 px.
// Lift the panorama and its footer seam by 50 px to share that residual between
// the two boundaries while retaining the intact artwork's aspect ratio.
const LANDSCAPE_SEAM_LIFT = 50;
const pages = [0, 1, 2, 3];
// Measured from reference_1080x2340, in master pixels (not device pixels).
// Each vertical anchor is independent: typography cannot push subsequent zones.
const masters = [
  { logo: [395, 116, 290, 282], heading: [165, 414, 750, 220], subtitle: [130, 652, 820, 58],
    main: [70, 758, 940, 886], quote: [375, 1685, 360, 180], landscapeTop: 1616,
    footer: 2072, dots: 2115, cta: [60, 2156, 960, 119] },
  { logo: [395, 86, 290, 282], heading: [150, 382, 780, 198], subtitle: [155, 604, 770, 160],
    main: [82, 800, 998, 985], quote: null, landscapeTop: 1556,
    footer: 2017, dots: 2065, cta: [60, 2113, 960, 125] },
  { logo: [395, 102, 290, 282], heading: [95, 415, 890, 204], subtitle: [160, 650, 760, 155],
    main: [0, 845, 1030, 799], quote: [385, 1635, 350, 180], landscapeTop: 1624,
    footer: 2082, dots: 2122, cta: [60, 2168, 960, 119] },
  { logo: [395, 100, 290, 282], heading: [120, 416, 840, 100], subtitle: [175, 536, 730, 152],
    main: [155, 713, 770, 802], quote: [250, 1544, 600, 176], landscapeTop: 1588,
    footer: 2040, dots: 2082, cta: [60, 2123, 960, 117] },
] as const;

const features = [
  { image: 'farmer', y: 758, height: 289, title: 'Sell directly to\nverified buyers', description: 'Get better prices for\nyour hard work.' },
  { image: 'plant', y: 1071, height: 281, title: 'Manage your crops\nwith ease', description: 'Track, update and grow\nyour produce.' },
  { image: 'community', y: 1375, height: 269, title: 'Be part of a trusted\nfarming community', description: 'Together for a prosperous\ntomorrow.' },
] as const;
const subtitles = [
  'From Soil to Sell, We Grow Together.',
  'Track your crops, monitor progress\nand get insights to improve yield\nand quality.',
  'Connect directly with buyers, explore\nlive market rates and get the best\nvalue for your produce.',
  'Join a trusted community of\nfarmers, FPOs, buyers and partners\nfor a sustainable future.',
];
const marketRows = [
  { icon: '🍅', name: 'Tomato', price: '₹1,420', movement: '↑ 2.5%', down: false },
  { icon: '🧅', name: 'Onion', price: '₹1,980', movement: '↓ 1.3%', down: true },
  { icon: '🌾', name: 'Wheat', price: '₹2,183', movement: '↑ 3.1%', down: false },
  { icon: '🫛', name: 'Soybean', price: '₹3,200', movement: '↑ 0.8%', down: false },
];

function mapping(width: number, height: number) {
  const sx = width / DESIGN_WIDTH;
  const sy = height / DESIGN_HEIGHT;
  return {
    sx, sy, font: Math.min(sx, sy),
    box: ([x, y, w, h]: Box): ViewStyle => ({ position: 'absolute', left: x * sx, top: y * sy, width: w * sx, height: h * sy }),
  };
}
type Mapping = ReturnType<typeof mapping>;

function Art({ name, frame, map, label }: { name: ArtName; frame: Box; map: Mapping; label?: string }) {
  const { size: [nativeWidth, nativeHeight], visible: [x, y, w, h] } = artBounds[name];
  const scale = Math.min(frame[2] * map.sx / w, frame[3] * map.sy / h);
  // Align the visible artwork, including its full composition, within the measured
  // target bounds. The surrounding transparent canvas stays intact and unclipped.
  return <Image source={artwork[name]} resizeMode="contain" fadeDuration={0}
    accessible={!!label} accessibilityLabel={label} style={{
      position: 'absolute',
      left: (frame[0] + frame[2] / 2) * map.sx - (x + w / 2) * scale,
      top: (frame[1] + frame[3] / 2) * map.sy - (y + h / 2) * scale,
      width: nativeWidth * scale, height: nativeHeight * scale,
    }} />;
}

function Heading({ page, map }: { page: number; map: Mapping }) {
  const frame = masters[page].heading;
  // Android's serif face has wider glyphs than Georgia at the same font size.
  const headingScale = map.font * (Platform.OS === 'android' ? 0.88 : 1);
  const firstLines = ['Welcome to', 'Grow Smarter', 'Fair Prices', 'Stronger Together'];
  return <View testID={`heading-${page}`} style={map.box(frame)}>
    {page === 3 ? <Text maxFontSizeMultiplier={1.05} style={[styles.heading, {
      fontSize: 87 * headingScale, lineHeight: 101 * map.font,
    }]}><Text style={styles.navy}>Stronger </Text><Text style={styles.green}>Together</Text></Text>
      : <>
        <Text maxFontSizeMultiplier={1.05} style={[styles.heading, page === 1 ? styles.green : styles.navy, {
          fontSize: (page === 2 ? 106 : page === 1 ? 98 : 91) * headingScale,
          lineHeight: 112 * map.font,
        }]}>{firstLines[page]}</Text>
        <Text maxFontSizeMultiplier={1.05} style={[styles.heading, {
          position: 'absolute', top: (page === 0 ? 90 : 101) * map.sy, width: '100%',
          fontSize: (page === 0 ? 127 : page === 1 ? 98 : 101) * headingScale,
          lineHeight: (page === 0 ? 139 : 115) * map.font,
        }]}>{page === 0 ? <><Text style={styles.green}>Farm</Text><Text style={styles.brown}>Prism</Text></>
          : <Text style={page === 1 ? styles.brown : styles.green}>{page === 1 ? 'Every Season' : 'Real Opportunities'}</Text>}</Text>
      </>}
  </View>;
}

function FeatureCards({ map }: { map: Mapping }) {
  return <>{features.map((card, i) => <View key={card.image} testID={`feature-card-${i}`} style={[
    map.box([70, card.y, 940, card.height]), styles.card, { borderRadius: 32 * map.font },
  ]}>
    <Art name={card.image} frame={[22, 7, 389, card.height - 14]} map={map} />
    <View style={map.box([458, 36, 450, card.height - 55])}>
      <Text maxFontSizeMultiplier={1.05} style={[styles.cardTitle, { fontSize: 44 * map.font, lineHeight: 51 * map.font }]}>{card.title}</Text>
      <Text maxFontSizeMultiplier={1.05} style={[styles.cardDescription, {
        fontSize: 37 * map.font, lineHeight: 43 * map.font, marginTop: 18 * map.sy,
      }]}>{card.description}</Text>
    </View>
  </View>)}</>;
}

function MarketCard({ map }: { map: Mapping }) {
  return <View style={[map.box([468, 844, 560, 596]), styles.market, { borderRadius: 26 * map.font, padding: 22 * map.font }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 68 * map.sy }}>
      <Text maxFontSizeMultiplier={1.05} style={[styles.marketTitle, { fontSize: 36 * map.font }]}>Live Market Price</Text>
      <Text maxFontSizeMultiplier={1.05} style={{ color: '#176b35', fontSize: 24 * map.font }}>View All →</Text>
    </View>
    {marketRows.map(row => <View key={row.name} style={[styles.marketRow, { height: 119 * map.sy }]}>
      <Text accessible={false} style={{ fontSize: 57 * map.font, width: 95 * map.sx }}>{row.icon}</Text>
      <Text maxFontSizeMultiplier={1.05} style={{ color: '#143c36', fontSize: 26 * map.font, width: 130 * map.sx }}>{row.name}</Text>
      <View style={{ flex: 1 }}>
        <Text maxFontSizeMultiplier={1.05} style={{ color: '#142e42', fontSize: 24 * map.font }}>
          <Text style={{ fontWeight: '700', fontSize: 30 * map.font }}>{row.price}</Text> / quintal
        </Text>
        <Text maxFontSizeMultiplier={1.05} style={{ color: row.down ? '#d63024' : '#12872e', fontSize: 30 * map.font, fontWeight: '700', marginTop: 9 * map.sy }}>{row.movement}</Text>
      </View>
    </View>)}
  </View>;
}

function PageArtwork({ page, map }: { page: number; map: Mapping }) {
  if (page === 0) return <FeatureCards map={map} />;
  // The native phone PNG includes a long sleeve and transparent upper padding.
  // Its handset, rather than that whole canvas, occupies the measured main zone.
  if (page === 1) return <Art name="phone" frame={[63, 685, 1080, 1295]} map={map} />;
  if (page === 2) return <>
    <Art name="crate" frame={[-18, 922, 637, 718]} map={map} />
    <MarketCard map={map} />
  </>;
  return <>
    <Art name="roles" frame={[155, 713, 770, 770]} map={map} label="FarmPrism community network" />
    {/* The supplied illustration has no role captions; these are reference labels,
        not selectable or persisted application roles. */}
    {([
      ['Farmers', 428, 925, 225], ['FPOs', 153, 1127, 200], ['Buyers', 730, 1127, 200],
      ['Logistics', 245, 1475, 240], ['Experts', 636, 1475, 225],
    ] as const).map(([text, x, y, w]) => <Text key={text} maxFontSizeMultiplier={1.05}
      style={[map.box([x, y, w, 44]), styles.roleCaption, { fontSize: 35 * map.font }]}>{text}</Text>)}
  </>;
}

function Landscape({ page, map }: { page: number; map: Mapping }) {
  // The clipped panorama's first substantial alpha is at native Y=125.
  // Align that cloud edge, rather than its mostly transparent image-box top.
  // This uniform 3:1 scale retains the farmhouse and sunrise in the viewport.
  return <Image source={artwork.landscape} resizeMode="contain" fadeDuration={0} style={{
    position: 'absolute', left: -205 * map.sx,
    top: (masters[page].landscapeTop + 30 - LANDSCAPE_SEAM_LIFT) * map.sy - 125 * (1728 / 2172) * map.sx,
    width: 1728 * map.sx, height: 576 * map.sx,
  }} />;
}

export function GetStartedScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'GetStarted'>) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState({ width: window.width, height: window.height });
  const { width, height } = viewport;
  const safeBottom = Math.max(insets.bottom, 12);
  const safeTop = insets.top;
  const map = mapping(width, Math.max(1, height - safeTop - safeBottom));
  const list = useRef<FlatList<number>>(null);
  const currentPage = useRef(0);
  useEffect(() => {
    list.current?.scrollToOffset({ offset: currentPage.current * width, animated: false });
  }, [width]);
  const goToPage = (page: number) => {
    currentPage.current = Math.max(0, Math.min(3, page));
    list.current?.scrollToOffset({ offset: currentPage.current * width, animated: true });
  };

  return <View style={styles.root} onLayout={({ nativeEvent }) => setViewport(nativeEvent.layout)}>
    <StatusBar hidden />
    <FlatList ref={list} data={pages} horizontal pagingEnabled bounces={false} overScrollMode="never"
      decelerationRate="fast" initialNumToRender={4} windowSize={5} showsHorizontalScrollIndicator={false}
      keyExtractor={String} extraData={`${width}:${height}:${safeTop}:${safeBottom}`}
      getItemLayout={(_, index) => ({ length: width, offset: index * width, index })}
      onMomentumScrollEnd={({ nativeEvent }) => { currentPage.current = Math.round(nativeEvent.contentOffset.x / width); }}
      renderItem={({ item: page }) => {
        const master = masters[page];
        const quoteNames = ['farmersQuote', null, 'marketsQuote', 'togetherQuote'] as const;
        const quoteName = quoteNames[page];
        return <View style={{ width, height, overflow: 'hidden', backgroundColor: '#fffef5' }}>
          <View style={{ position: 'absolute', top: safeTop, left: 0, width, height: height - safeTop - safeBottom }}>
            <Art name="leftLeaves" frame={[-35, -36, 326, 425]} map={map} />
            <Art name="rightLeaves" frame={[789, -36, 326, 425]} map={map} />
            {/* Continue the ground behind the curved white footer where the
                panorama's own lower edge is transparent. */}
            <View style={[map.box([0, master.footer - LANDSCAPE_SEAM_LIFT - 12, DESIGN_WIDTH, DESIGN_HEIGHT - master.footer + LANDSCAPE_SEAM_LIFT + 12]), { backgroundColor: '#39772b' }]} />
            {page !== 1 && <Landscape page={page} map={map} />}
            <Art name="logo" frame={master.logo} map={map} label="FarmPrism" />
            <Heading page={page} map={map} />
            <Text testID={`subtitle-${page}`} maxFontSizeMultiplier={1.05} style={[
              map.box(master.subtitle), styles.subtitle, { fontSize: (page === 0 ? 45 : 44) * map.font, lineHeight: 52 * map.font },
            ]}>{subtitles[page]}</Text>
            <PageArtwork page={page} map={map} />
            {/* Foreground fields naturally mask the sleeve's lower canvas edge. */}
            {page === 1 && <Landscape page={page} map={map} />}
            {master.quote && quoteName && <Art name={quoteName} frame={master.quote} map={map} />}
            <View testID={`footer-${page}`} style={[
              map.box([0, master.footer - LANDSCAPE_SEAM_LIFT, DESIGN_WIDTH, DESIGN_HEIGHT - master.footer + LANDSCAPE_SEAM_LIFT]), styles.footer,
              { height: (DESIGN_HEIGHT - master.footer + LANDSCAPE_SEAM_LIFT) * map.sy + safeBottom, borderTopLeftRadius: 126 * map.font, borderTopRightRadius: 126 * map.font },
            ]} />
            <View style={[map.box([430, master.dots - 36, 220, 72]), styles.dots]}>
              {pages.map(dot => <Pressable key={dot} accessibilityRole="button" accessibilityLabel={`Go to introduction page ${dot + 1}`}
                accessibilityState={{ selected: dot === page }} onPress={() => goToPage(dot)} hitSlop={{ top: 6, bottom: 6 }}
                style={{ width: 52 * map.sx, height: 72 * map.sy, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 29 * map.font, height: 29 * map.font, borderRadius: 15 * map.font, backgroundColor: dot === page ? '#176731' : '#c0d1b8' }} />
              </Pressable>)}
            </View>
            <Pressable testID={`cta-${page}`} accessibilityRole="button" accessibilityLabel={page === 3 ? 'Get Started' : 'Next'}
              onPress={() => page === 3 ? navigation.navigate('PhoneLogin') : goToPage(page + 1)}
              style={({ pressed }) => [map.box(master.cta), styles.button, { borderRadius: 24 * map.font }, pressed && styles.pressed]}>
              <Text maxFontSizeMultiplier={1.2} style={{ color: '#fff', fontWeight: '600', fontSize: 43 * map.font }}>{page === 3 ? 'Get Started' : 'Next'}</Text>
              <Text accessible={false} style={{ color: '#fff', fontSize: 58 * map.font, marginLeft: 30 * map.sx }}>→</Text>
            </Pressable>
          </View>
        </View>;
      }} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fffef5' },
  heading: { textAlign: 'center', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), fontWeight: '700', includeFontPadding: false },
  navy: { color: '#0c2b3d' }, green: { color: '#125a2b' }, brown: { color: '#78300e' },
  subtitle: { textAlign: 'center', color: '#4f5f6e', includeFontPadding: false },
  card: { backgroundColor: '#f5f7e9', borderWidth: 1, borderColor: '#e6ecd8', shadowColor: '#506f39', shadowOpacity: 0.09, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardTitle: { color: '#17632f', fontWeight: '700', includeFontPadding: false },
  cardDescription: { color: '#66717a', includeFontPadding: false },
  market: { backgroundColor: '#fff', shadowColor: '#435d30', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  marketTitle: { color: '#135538', fontWeight: '700' },
  marketRow: { borderTopWidth: 1, borderTopColor: '#edf0e9', flexDirection: 'row', alignItems: 'center' },
  roleCaption: { textAlign: 'center', color: '#073d35', fontWeight: '700', includeFontPadding: false },
  footer: { backgroundColor: '#fff' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  button: { backgroundColor: '#206632', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.87 },
});
