import { useRef, type PropsWithChildren } from 'react';
import { Alert, Image, ImageBackground, Pressable, ScrollView, Text as NativeText, View, useWindowDimensions, type StyleProp, type ViewStyle, type TextProps } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dashboardAssets as a } from './dashboardAssets';
import { createDashboardData, type DashboardData, type DashboardProfile, type Destination } from './dashboardData';
import { s } from './dashboardStyles';

function Text(props: TextProps) {
  return <NativeText {...props} style={[{ includeFontPadding: false }, props.style]} />;
}

function comingSoon(destination: Destination, detail?: string) {
  Alert.alert('Coming Soon', `${destination}${detail ? ` — ${detail}` : ''} will be available soon.`);
}
function Icon({ source, size = 20 }: { source: number; size?: number }) {
  return <Image source={source} resizeMode="contain" fadeDuration={0} style={{ width: size, height: size }} />;
}
function Action({ destination, label, children, style, detail }: PropsWithChildren<{ destination: Destination; label: string; style?: StyleProp<ViewStyle>; detail?: string }>) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => comingSoon(destination, detail)} style={({ pressed }) => [style, pressed && s.pressed]}>{children}</Pressable>;
}
function Heading({ icon, title, action }: { icon: number; title: string; action?: { label: string; destination: Destination } }) {
  return <View style={s.heading}><Icon source={icon} /><Text style={s.title}>{title}</Text>{action && <Action destination={action.destination} label={action.label} style={s.link}><Text style={s.linkText}>{action.label} ›</Text></Action>}</View>;
}

function DashboardHeader({ data, top, compact }: { data: DashboardData; top: number; compact: boolean }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 18 ? 'Good Afternoon,' : 'Good Evening,';
  return <ImageBackground source={a.heroBackground} resizeMode="cover" style={[s.hero, { paddingTop: top }]}>

    <View style={s.heroWash} pointerEvents="none" /><View style={s.top}><Image source={a.logo} resizeMode="contain" style={s.logo} /><Action destination="Notifications" label="Notifications" style={s.bell}><Icon source={a.notification} size={23} /><View style={s.bellMask} />{data.notifications.unreadCount > 0 && <View style={s.dot} />}</Action></View>
    <View style={s.heroRow}>
      <View style={s.greetingBlock}><Text style={s.greeting}>{greeting}</Text><Text style={[s.name, { fontSize: compact ? 26 : 28 }]}>{data.fullName}</Text><Text style={s.subtitle}>Better markets. Brighter futures.</Text><Text style={s.location}>⌖ {data.location}</Text></View>
      <View style={s.artwork}><Image source={a.hero} resizeMode="contain" style={s.farmer} /><Image source={a.heroCallout} resizeMode="contain" style={s.callout} /></View>
    </View>
  </ImageBackground>;
}
function FarmOverviewCard({ data }: { data: DashboardData }) {
  const stats = [
    { value: String(data.farm.crops), unit: 'Crops', label: 'You Grow' },
    { value: data.farm.acres, unit: 'Acres', label: 'Total Land' },
    { value: data.farm.quintals, unit: 'Quintals', label: 'Available to Sell' },
  ];
  return <View style={s.card}><Heading icon={a.farm} title="Your Farm at a Glance" action={{ label: 'View Details', destination: 'My Farm' }} /><View style={s.row}>
    {stats.map(stat => <View key={stat.unit} style={s.stat}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={s.value}>{stat.value}</Text><Text style={s.unit}>{stat.unit}</Text><Text style={s.meta}>{stat.label}</Text></View>)}
    <Action destination="My Farm" label="Manage My Farm" style={s.manage}><Text style={s.arrow}>›</Text><Text style={s.manageText}>Manage{ '\n' }My Farm</Text></Action>
  </View></View>;
}
function TopOpportunityCard({ data }: { data: DashboardData }) {
  const item = data.opportunity;
  return <View style={[s.card, s.opportunity]}><Heading icon={a.opportunity} title="Top Opportunity for You" action={{ label: 'View All', destination: 'Sell > Buyer Opportunities' }} /><View style={s.row}>
    <Image source={a.tomato} resizeMode="contain" style={s.tomato} />
    <Action destination="Sell > Buyer Opportunities" label="Tomato buyer opportunities" style={s.details}><Text style={s.cropTitle}>{item.crop}</Text><Text style={s.badge}>High Demand</Text><Text style={s.meta}>{item.buyers}</Text><Text style={s.offerPrice}>{item.price}<Text style={s.meta}> / Quintal</Text></Text><Text style={s.meta}>Market: {item.reference} / Quintal</Text></Action>
    <View style={s.aside}><View style={s.advantage}><Text style={s.advantageValue}>↗ {item.advantage}</Text><Text style={s.meta}>/ Quintal</Text></View><Action destination="Sell > Compare Offers" label="View Offers" style={s.offers}><Text style={s.offersText}>View Offers →</Text></Action></View>
  </View></View>;
}
function MarketPriceSection({ data }: { data: DashboardData }) {
  return <View style={s.card}><Heading icon={a.market} title="Today’s Market Prices" action={{ label: 'View Market', destination: 'Insights > Market Prices' }} /><View style={s.row}>{data.market.map(item => <Action key={item.name} destination="Insights > Crop Market Detail" detail={item.name} label={`${item.name} market details`} style={s.marketTile}><Image source={item.image} resizeMode="contain" style={s.cropImage} /><View style={s.marketCopy}><Text style={s.cropName}>{item.name}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={s.price}>{item.price}</Text><Text style={s.meta}>/ Quintal</Text><Text style={s.trend}>↗ {item.trend}</Text></View></Action>)}</View></View>;
}
function SellingActivitySection({ data }: { data: DashboardData }) {
  return <View style={s.card}><Heading icon={a.listing} title="Your Selling Activity" /><View style={s.row}>{data.activity.map(item => <Action key={item.label} destination={item.destination} label={item.action} style={[s.tile, s[item.tone]]}><View style={s.activityTop}><Icon source={item.icon} size={25} /><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={s.activityValue}>{item.value}</Text></View><Text style={s.unit}>{item.label}</Text><Text style={s.activityAction}>{item.action} ›</Text></Action>)}</View></View>;
}
function QuickActionsGrid({ data }: { data: DashboardData }) {
  return <View style={s.card}><Heading icon={a.opportunity} title="Quick Actions" /><View style={s.row}>{data.quickActions.map(item => <Action key={item.label} destination={item.destination} label={item.label} style={[s.tile, s.quick, s[item.tone]]}><Icon source={item.icon} size={30} /><Text style={s.quickLabel}>{item.label}</Text></Action>)}</View></View>;
}
function FarmerBottomNav({ data, safeBottom, onHome }: { data: DashboardData; safeBottom: number; onHome: () => void }) {
  return <View style={[s.nav, { paddingBottom: safeBottom }]}>{data.nav.map(item => {
    const selected = item.destination === null;
    return <Pressable key={item.label} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }} onPress={() => item.destination ? comingSoon(item.destination) : onHome()} style={({ pressed }) => [s.navItem, pressed && s.pressed]}><View style={[s.navIcon, selected && s.selected]}><Icon source={item.icon} size={28} /></View><Text style={[s.navLabel, selected && s.selectedLabel]}>{item.label}</Text></Pressable>;
  })}</View>;
}
export function FarmerDashboardView({ draft }: { draft: DashboardProfile }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const data = createDashboardData(draft);
  return <View style={s.root}><StatusBar hidden /><ScrollView ref={scroll} style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <DashboardHeader data={data} top={Math.max(insets.top, 8)} compact={width < 400} />
    <View style={s.body}><FarmOverviewCard data={data} /><TopOpportunityCard data={data} /><MarketPriceSection data={data} /><SellingActivitySection data={data} /><QuickActionsGrid data={data} /></View>
  </ScrollView><FarmerBottomNav data={data} safeBottom={Math.max(insets.bottom, 18)} onHome={() => scroll.current?.scrollTo({ y: 0, animated: true })} /></View>;
}


