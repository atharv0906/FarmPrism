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
function Icon({ source, size = 24 }: { source: number; size?: number }) {
  return <Image source={source} resizeMode="contain" fadeDuration={0} style={{ width: size, height: size }} />;
}
function Action({ destination, label, children, style, detail }: PropsWithChildren<{ destination: Destination; label: string; style?: StyleProp<ViewStyle>; detail?: string }>) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => comingSoon(destination, detail)} style={({ pressed }) => [style, pressed && s.pressed]}>{children}</Pressable>;
}
function Heading({ icon, title, action }: { icon: number; title: string; action?: { label: string; destination: Destination } }) {
  return <View style={s.heading}><Icon source={icon} /><Text style={s.title}>{title}</Text>{action && <Action destination={action.destination} label={action.label} style={s.link}><Text style={s.linkText}>{action.label} ›</Text></Action>}</View>;
}

function DashboardHeader({ data, top, compact }: { data: DashboardData; top: number; compact: boolean }) {
  const { width } = useWindowDimensions();
  const artworkWidth = (width - 32) * 0.45;
  const farmerWidth = Math.min(145, artworkWidth - 20);
  const farmerHeight = farmerWidth * 1402 / 1122;
  const calloutSize = Image.resolveAssetSource(a.heroCallout);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 18 ? 'Good Afternoon,' : 'Good Evening,';
  return <ImageBackground source={a.heroBackground} resizeMode="cover" style={[s.hero, { paddingTop: top }]}>

    <View style={s.heroWash} pointerEvents="none" /><View style={s.top}><Image source={a.logo} resizeMode="contain" style={s.logo} /><Action destination="Notifications" label="Notifications" style={s.bell}><Icon source={a.notification} size={23} /><View style={s.bellMask} />{data.notifications.unreadCount > 0 && <View style={s.dot} />}</Action></View>
    <View style={[s.heroRow, { minHeight: Math.max(120, farmerHeight - 40) }]}>
      <View style={s.greetingBlock}><Text style={s.greeting}>{greeting}</Text><Text style={[s.name, { fontSize: compact ? 26 : 28 }]}>{data.fullName}</Text><Text style={s.subtitle}>Better markets. Brighter futures.</Text><Text style={s.location}>⌖ {data.location}</Text></View>
      <View style={s.artwork}><Image source={a.hero} resizeMode="contain" style={[s.farmer, { width: farmerWidth, height: farmerHeight }]} /><Image source={a.heroCallout} resizeMode="contain" style={[s.callout, { width: 62, height: 62 * calloutSize.height / calloutSize.width }]} /></View>
    </View>
  </ImageBackground>;
}
function FarmOverviewCard({ data }: { data: DashboardData }) {
  const stats = [
    { value: String(data.farm.crops), unit: 'Crops', label: 'You Grow', icon: a.farm },
    { value: data.farm.acres, unit: 'Acres', label: 'Total Land', icon: a.navMyFarm },
    { value: data.farm.quintals, unit: 'Quintals', label: 'Available to Sell', icon: a.orders },
  ];
  return <View style={s.card}><Heading icon={a.farm} title="Your Farm at a Glance" action={{ label: 'View Details', destination: 'My Farm' }} /><View style={s.row}>
    {stats.map(stat => <View key={stat.unit} style={s.stat}><View style={s.statIcon}><Icon source={stat.icon} size={22} /></View><View style={s.statCopy}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={s.value}>{stat.value}</Text><Text style={s.unit}>{stat.unit}</Text><Text style={s.statLabel}>{stat.label}</Text></View></View>)}
    <Action destination="My Farm" label="Manage My Farm" style={s.manage}><Text style={s.arrow}>›</Text><Text style={s.manageText}>Manage{ '\n' }My Farm</Text></Action>
  </View></View>;
}
const currency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function TopOpportunityCard({ data }: { data: Pick<DashboardData, 'opportunity'> }) {
  const { width } = useWindowDimensions();
  // Screen gutters (24), card padding/borders (26), and two body gaps (12).
  const cropSize = (width - 62) * 0.28;
  const item = data.opportunity;
  const hasOffer = item?.highestOffer != null;
  return (
    <View style={[s.card, s.opportunity]}>
      <View style={s.opportunityHeading}>
        <View style={s.opportunityTitleGroup}>
          <Icon source={a.opportunity} />
          <Text style={s.title}>Top Opportunity for You</Text>
        </View>
        {item?.demandLevel && <Text style={s.badge}>{item.demandLevel}</Text>}
        <Action destination="Sell > Buyer Opportunities" label="View All" style={s.link}>
          <Text style={s.linkText}>View All ›</Text>
        </Action>
      </View>
      {!item ? (
        <View style={s.opportunityEmpty}>
          <Text style={s.cropTitle}>No offers yet</Text>
          <Action destination="Sell > Buyer Opportunities" label="Find Buyers" style={s.link}>
            <Text style={s.linkText}>Find Buyers →</Text>
          </Action>
        </View>
      ) : (
        <View style={s.opportunityBody}>
          <View style={s.opportunityArtwork}><Image source={item.image} resizeMode="contain" style={[s.opportunityImage, { width: cropSize, height: cropSize }]} /></View>
          <Action destination="Sell > Buyer Opportunities" detail={item.cropId} label={`${item.cropName} buyer opportunities`} style={s.details}>
            <Text style={s.cropTitle}>{item.cropName}</Text>
            {item.verifiedBuyerCount != null && (
              <Text style={s.meta}>{item.verifiedBuyerCount} verified {item.verifiedBuyerCount === 1 ? 'buyer is' : 'buyers are'} interested</Text>
            )}
            <View>
              <Text style={s.meta}>{hasOffer ? 'Highest offer' : 'No offers yet'}</Text>
              {item.highestOffer != null && <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={s.offerPrice}>{currency(item.highestOffer)}<Text style={s.offerUnit}> / {item.unit}</Text></Text>}
            </View>
            {item.marketReference != null && <Text style={s.marketReference}>Mandi: {currency(item.marketReference)} / {item.unit}</Text>}
          </Action>
          <View style={s.aside}>
            {item.differencePerUnit != null && (
              <View style={s.advantage}>
                <Text style={s.advantageTrend}>{item.differencePerUnit > 0 ? '↗' : item.differencePerUnit < 0 ? '↘' : '→'}</Text>
                <View style={s.advantageCopy}>
                  <Text style={s.advantageLabel}>{item.differencePerUnit > 0 ? 'You can get' : 'Offer difference'}</Text>
                  <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={s.advantageValue}>{currency(Math.abs(item.differencePerUnit))} {item.differencePerUnit > 0 ? 'more' : item.differencePerUnit < 0 ? 'less' : ''}</Text>
                  <Text style={s.meta}>/ {item.unit}</Text>
                </View>
              </View>
            )}
            <Action destination={hasOffer ? 'Sell > Compare Offers' : 'Sell > Buyer Opportunities'} detail={item.cropId} label={hasOffer ? 'View Offers' : 'Find Buyers'} style={s.offers}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={s.offersText}>{hasOffer ? 'View Offers' : 'Find Buyers'} →</Text>
            </Action>
          </View>
        </View>
      )}
    </View>
  );
}
function MarketPriceSection({ data }: { data: DashboardData }) {
  return <View style={s.card}><Heading icon={a.market} title="Today’s Market Prices" action={{ label: 'View Market', destination: 'Insights > Market Prices' }} /><View style={s.row}>{data.market.map(item => <Action key={item.name} destination="Insights > Crop Market Detail" detail={item.name} label={`${item.name} market details`} style={s.marketTile}><Image source={item.image} resizeMode="contain" style={s.cropImage} /><View style={s.marketCopy}><Text style={s.cropName}>{item.name}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={s.price}>{item.price}</Text><Text style={s.meta}>/ Quintal</Text><Text style={s.trend}>↗ {item.trend}</Text></View></Action>)}</View></View>;
}
function SellingActivitySection({ data }: { data: DashboardData }) {
  return <View style={s.card}><Heading icon={a.listing} title="Your Selling Activity" /><View style={s.row}>{data.activity.map(item => <Action key={item.label} destination={item.destination} label={item.action} style={[s.tile, s[item.tone]]}><View style={s.activityTop}><View style={s.activityIcon}><Icon source={item.icon} size={28} /></View><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={s.activityValue}>{item.value}</Text></View><Text style={s.unit}>{item.label}</Text><Text style={s.activityAction}>{item.action} ›</Text></Action>)}</View></View>;
}
function QuickActionsGrid({ data }: { data: DashboardData }) {
  return <View style={s.card}><Heading icon={a.opportunity} title="Quick Actions" /><View style={s.row}>{data.quickActions.map(item => <Action key={item.label} destination={item.destination} label={item.label} style={[s.tile, s.quick, s[item.tone]]}><View style={s.activityIcon}><Icon source={item.icon} size={32} /></View><Text style={s.quickLabel}>{item.label}</Text></Action>)}</View></View>;
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
