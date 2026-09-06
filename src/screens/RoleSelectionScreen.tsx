import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useRole } from '../hooks/useRole';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import type { ApplicationRole } from '../types/role';

const REFERENCE_WIDTH = 853;

const assets = {
  logo: require('../../assets/6. FarmPrism_Role_Page_Assets/role_farmprism_logo.png'),
  topLeftLeaves: require('../../assets/6. FarmPrism_Role_Page_Assets/role_top_left_leaves.png'),
  topRightLeaves: require('../../assets/6. FarmPrism_Role_Page_Assets/role_top_right_leaves.png'),
  dividerSprout: require('../../assets/6. FarmPrism_Role_Page_Assets/role_divider_sprout.png'),
  farmer: require('../../assets/6. FarmPrism_Role_Page_Assets/role_farmer_illustration.png'),
  fpo: require('../../assets/6. FarmPrism_Role_Page_Assets/role_fpo_illustration.png'),
  buyer: require('../../assets/6. FarmPrism_Role_Page_Assets/role_buyer_illustration.png'),
  logistics: require('../../assets/6. FarmPrism_Role_Page_Assets/role_logistics_illustration.png'),
  bottomLandscape: require('../../assets/6. FarmPrism_Role_Page_Assets/role_bottom_landscape.png'),
  bottomLeafCluster: require('../../assets/6. FarmPrism_Role_Page_Assets/role_bottom_leaf_cluster.png'),
};

type Props = NativeStackScreenProps<OnboardingStackParamList, 'RoleSelection'>;

type RoleCardDefinition = {
  key: 'farmer' | 'fpo' | 'buyer' | 'logistics';
  code: ApplicationRole | null;
  title: string;
  description: string;
  icon: string;
  image: number;
};

const roleCards: RoleCardDefinition[] = [
  {
    key: 'farmer',
    code: 'farmer',
    title: 'Farmer',
    description: 'Manage your crops, inventory,\nand connect with buyers directly.',
    icon: '🌱',
    image: assets.farmer,
  },
  {
    key: 'fpo',
    code: null,
    title: 'FPO Dashboard',
    description: 'Monitor member activity,\ninventory, pricing, and\ncollective operations.',
    icon: '👥',
    image: assets.fpo,
  },
  {
    key: 'buyer',
    code: 'buyer',
    title: 'Buyer Marketplace',
    description: 'Browse products, place bulk\norders, and connect with\nverified farmers.',
    icon: '🛒',
    image: assets.buyer,
  },
  {
    key: 'logistics',
    code: 'logistics',
    title: 'Logistics Console',
    description: 'Optimize routes, manage fleets,\nand track deliveries in real-time.',
    icon: '🚚',
    image: assets.logistics,
  },
];

export function RoleSelectionScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    availableRoles,
    error: roleError,
    selectRole,
  } = useRole();

  const s = width / REFERENCE_WIDTH;
  const safeBottom = Math.max(insets.bottom, 18);

  const [selectedCode, setSelectedCode] = useState<ApplicationRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const availableByCode = useMemo(
    () =>
      new Map<ApplicationRole, string>(
        availableRoles.map((role) => [role.code, role.id]),
      ),
    [availableRoles],
  );

  const horizontalPadding = 24 * s;
  const cardGap = 14 * s;
  const cardWidth = (width - horizontalPadding * 2 - cardGap) / 2;

  const selectCard = (card: RoleCardDefinition) => {
    setLocalError(null);

    if (!card.code) {
      Alert.alert(
        'Coming Soon',
        'FPO Dashboard is visible for the FarmPrism ecosystem, but it is not available as an app role yet.',
      );
      return;
    }

    if (!availableByCode.has(card.code)) {
      Alert.alert(
        'Role unavailable',
        'This role is not currently assigned to your account.',
      );
      return;
    }

    setSelectedCode(card.code);
  };

  const continueWithRole = async () => {
    if (!selectedCode || saving) return;

    const roleId = availableByCode.get(selectedCode);
    if (!roleId) {
      setLocalError('This role is not currently assigned to your account.');
      return;
    }

    setSaving(true);
    setLocalError(null);

    try {
      await selectRole(roleId);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'Unable to save your role. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <Image
        source={assets.topLeftLeaves}
        resizeMode="contain"
        fadeDuration={0}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -19 * s,
          top: -28 * s,
          width: 185 * s,
          height: 185 * s,
          zIndex: 2,
        }}
      />

      <Image
        source={assets.topRightLeaves}
        resizeMode="contain"
        fadeDuration={0}
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -18 * s,
          top: -26 * s,
          width: 185 * s,
          height: 185 * s,
          zIndex: 2,
        }}
      />

      <ScrollView
        style={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 10) + 12 * s,
          paddingBottom: safeBottom + 18 * s,
        }}
      >
        <View style={styles.header}>
          <Image
            source={assets.logo}
            resizeMode="contain"
            fadeDuration={0}
            accessibilityLabel="FarmPrism"
            style={{
              width: 205 * s,
              height: 205 * s,
            }}
          />

          <Text
            style={[
              styles.title,
              {
                fontSize: Math.max(25, 49 * s),
                lineHeight: Math.max(31, 58 * s),
                marginTop: 6 * s,
              },
            ]}
          >
            <Text style={styles.titleGreen}>Choose Your </Text>
            <Text style={styles.titleBrown}>Role</Text>
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                fontSize: Math.max(14, 25 * s),
                lineHeight: Math.max(20, 33 * s),
                marginTop: 6 * s,
              },
            ]}
          >
            Select how you want to join the FarmPrism ecosystem.
          </Text>

          <Image
            source={assets.dividerSprout}
            resizeMode="contain"
            fadeDuration={0}
            pointerEvents="none"
            style={{
              width: 195 * s,
              height: 64 * s,
              marginTop: -2 * s,
              marginBottom: 7 * s,
            }}
          />
        </View>

        <View
          style={[
            styles.grid,
            {
              paddingHorizontal: horizontalPadding,
              columnGap: cardGap,
              rowGap: 14 * s,
            },
          ]}
        >
          {roleCards.map((card) => {
            const selected = card.code === selectedCode;
            const isFpo = card.code === null;

            return (
              <Pressable
                key={card.key}
                accessibilityRole="button"
                accessibilityLabel={`${card.title}${selected ? ', selected' : ''}`}
                accessibilityState={{ selected }}
                onPress={() => selectCard(card)}
                style={({ pressed }) => [
                  styles.roleCard,
                  {
                    width: cardWidth,
                    minHeight: 462 * s,
                    borderRadius: 21 * s,
                    borderColor: selected ? '#1B7336' : '#D9E1C9',
                    borderWidth: selected ? 2 : 1,
                    opacity: pressed ? 0.95 : 1,
                  },
                  selected && styles.roleCardSelected,
                ]}
              >
                <Image
                  source={card.image}
                  resizeMode="contain"
                  fadeDuration={0}
                  style={{
                    width: cardWidth - 18 * s,
                    height: 215 * s,
                    marginTop: 4 * s,
                    alignSelf: 'center',
                  }}
                />

                <View
                  style={[
                    styles.roleIconBadge,
                    {
                      width: 82 * s,
                      height: 82 * s,
                      borderRadius: 41 * s,
                      marginTop: -32 * s,
                      marginLeft: 18 * s,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: Math.max(18, 35 * s),
                    }}
                  >
                    {card.icon}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.roleTitle,
                    {
                      fontSize: Math.max(15, 29 * s),
                      lineHeight: Math.max(20, 36 * s),
                      marginTop: -43 * s,
                      marginLeft: 120 * s,
                      paddingRight: 12 * s,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {card.title}
                </Text>

                <Text
                  style={[
                    styles.roleDescription,
                    {
                      fontSize: Math.max(12, 20 * s),
                      lineHeight: Math.max(17, 26 * s),
                      marginTop: 18 * s,
                      paddingHorizontal: 36 * s,
                    },
                  ]}
                >
                  {card.description}
                </Text>

                <View style={styles.cardSpacer} />

                <View
                  style={[
                    styles.selectButton,
                    {
                      height: 66 * s,
                      marginHorizontal: 27 * s,
                      marginBottom: 21 * s,
                      borderRadius: 15 * s,
                    },
                    selected && styles.selectButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      {
                        fontSize: Math.max(14, 24 * s),
                      },
                    ]}
                  >
                    {selected ? 'Selected' : 'Select Role'}
                  </Text>

                  <Text
                    style={[
                      styles.selectArrow,
                      {
                        fontSize: Math.max(20, 38 * s),
                        marginLeft: 14 * s,
                      },
                    ]}
                  >
                    {selected ? '✓' : '→'}
                  </Text>
                </View>

                {isFpo && (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.comingSoonDot,
                      {
                        top: 12 * s,
                        right: 12 * s,
                        width: 10 * s,
                        height: 10 * s,
                        borderRadius: 5 * s,
                      },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.communityBanner,
            {
              marginHorizontal: 28 * s,
              marginTop: 24 * s,
              minHeight: 118 * s,
              borderRadius: 18 * s,
              paddingVertical: 18 * s,
              paddingHorizontal: 135 * s,
            },
          ]}
        >
          <Image
            source={assets.bottomLeafCluster}
            resizeMode="contain"
            fadeDuration={0}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 28 * s,
              top: 24 * s,
              width: 72 * s,
              height: 72 * s,
              transform: [{ scaleX: -1 }],
            }}
          />

          <Text
            style={[
              styles.bannerTitle,
              {
                fontSize: Math.max(15, 23 * s),
                lineHeight: Math.max(20, 29 * s),
              },
            ]}
          >
            Together, let’s build a better tomorrow.
          </Text>

          <Text
            style={[
              styles.bannerSubtitle,
              {
                fontSize: Math.max(12, 18 * s),
                lineHeight: Math.max(17, 24 * s),
                marginTop: 6 * s,
              },
            ]}
          >
            Stronger Farmers. Healthier Communities. A Sustainable Future.
          </Text>

          <Image
            source={assets.bottomLeafCluster}
            resizeMode="contain"
            fadeDuration={0}
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 10 * s,
              bottom: -2 * s,
              width: 105 * s,
              height: 105 * s,
            }}
          />
        </View>

        {(localError || roleError?.message) && (
          <Text
            style={[
              styles.errorText,
              {
                fontSize: Math.max(12, 17 * s),
                marginHorizontal: 34 * s,
                marginTop: 10 * s,
              },
            ]}
          >
            {localError ?? roleError?.message}
          </Text>
        )}

        <View
          style={[
            styles.bottomActions,
            {
              paddingHorizontal: 52 * s,
              columnGap: 24 * s,
              marginTop: 24 * s,
              marginBottom: 8 * s,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            style={({ pressed }) => [
              styles.backButton,
              {
                height: 78 * s,
                borderRadius: 17 * s,
                opacity: pressed ? 0.84 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.backArrow,
                {
                  fontSize: Math.max(22, 40 * s),
                  marginRight: 15 * s,
                },
              ]}
            >
              ←
            </Text>
            <Text
              style={[
                styles.backText,
                {
                  fontSize: Math.max(15, 25 * s),
                },
              ]}
            >
              Back
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            accessibilityState={{ disabled: !selectedCode || saving }}
            disabled={!selectedCode || saving}
            onPress={() => void continueWithRole()}
            style={({ pressed }) => [
              styles.continueButton,
              {
                height: 78 * s,
                borderRadius: 17 * s,
                opacity: !selectedCode || saving ? 0.52 : pressed ? 0.86 : 1,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text
                  style={[
                    styles.continueText,
                    {
                      fontSize: Math.max(15, 25 * s),
                    },
                  ]}
                >
                  Continue
                </Text>
                <Text
                  style={[
                    styles.continueArrow,
                    {
                      fontSize: Math.max(22, 40 * s),
                      marginLeft: 16 * s,
                    },
                  ]}
                >
                  →
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View
          style={{
            height: 220 * s,
            marginTop: -4 * s,
            overflow: 'hidden',
          }}
          pointerEvents="none"
        >
          <Image
            source={assets.bottomLandscape}
            resizeMode="cover"
            fadeDuration={0}
            style={{
              width,
              height: 260 * s,
            }}
          />
        </View>

        <View style={{ height: safeBottom }} />
      </ScrollView>
    </View>
  );
}

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FBFBF3',
  },
  scroll: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  title: {
    fontFamily: serif,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  titleGreen: {
    color: '#073D25',
  },
  titleBrown: {
    color: '#722A0B',
  },
  subtitle: {
    color: '#18324F',
    textAlign: 'center',
    includeFontPadding: false,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
  },
  roleCard: {
    backgroundColor: '#FFFDF6',
    overflow: 'hidden',
    shadowColor: '#355022',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  roleCardSelected: {
    backgroundColor: '#FDFFF5',
    shadowOpacity: 0.16,
    elevation: 4,
  },
  roleIconBadge: {
    backgroundColor: '#F0FFDA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2EFD0',
    zIndex: 2,
  },
  roleTitle: {
    color: '#0C3723',
    fontFamily: serif,
    fontWeight: '700',
    includeFontPadding: false,
  },
  roleDescription: {
    color: '#233B5C',
    includeFontPadding: false,
  },
  cardSpacer: {
    flex: 1,
    minHeight: 8,
  },
  selectButton: {
    backgroundColor: '#237A33',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#254322',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  selectButtonSelected: {
    backgroundColor: '#165F2A',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    includeFontPadding: false,
  },
  selectArrow: {
    color: '#FFFFFF',
    fontWeight: '300',
    includeFontPadding: false,
  },
  comingSoonDot: {
    position: 'absolute',
    backgroundColor: '#D39B2A',
  },
  communityBanner: {
    backgroundColor: '#F2F6E5',
    borderWidth: 1,
    borderColor: '#D7DFC1',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerTitle: {
    color: '#174C2E',
    fontFamily: serif,
    fontWeight: '600',
    includeFontPadding: false,
  },
  bannerSubtitle: {
    color: '#4D7657',
    includeFontPadding: false,
  },
  errorText: {
    color: '#B3261E',
    textAlign: 'center',
    includeFontPadding: false,
  },
  bottomActions: {
    flexDirection: 'row',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FFFEF8',
    borderWidth: 2,
    borderColor: '#126032',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  backArrow: {
    color: '#176536',
    includeFontPadding: false,
  },
  backText: {
    color: '#176536',
    fontWeight: '600',
    includeFontPadding: false,
  },
  continueButton: {
    flex: 1.12,
    backgroundColor: '#237A33',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#254322',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  continueText: {
    color: '#FFFFFF',
    fontWeight: '600',
    includeFontPadding: false,
  },
  continueArrow: {
    color: '#FFFFFF',
    includeFontPadding: false,
  },
});
