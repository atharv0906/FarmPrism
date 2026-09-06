import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import {
  useRef,
  useState,
} from 'react';

import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '../navigation/AuthNavigator';

const artwork = {
  logo: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_farmprism_logo.png',
  ),

  topLeftLeaves: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_top_left_leaves.png',
  ),

  topRightLeaves: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_top_right_leaves.png',
  ),

  bottomLandscape: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_bottom_landscape.png',
  ),

  farmerPortrait: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_farmer_portrait.png',
  ),

  farmerProduce: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_farmer_produce_crate.png',
  ),

  producePhone: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_produce_phone.png',
  ),

  sproutingPlant: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_sprouting_plant.png',
  ),

  teamNetwork: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_team_network.png',
  ),

  teamRoles: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_team_roles.png',
  ),
};

const slides = [
  {
    title: 'Welcome to FarmPrism',
    description:
      'From soil to sell, FarmPrism helps you grow, connect and move your produce with confidence.',
    accent: 'Grow together',
    illustration: artwork.farmerPortrait,
    kind: 'farmer',
  },

  {
    title: 'Grow Smarter Every Season',
    description:
      'Keep your farming journey organised and make better decisions season after season.',
    accent: 'Farm smarter',
    illustration: artwork.producePhone,
    kind: 'phone',
  },

  {
    title: 'Fair Prices, Real Opportunities',
    description:
      'Discover better market opportunities and connect your produce with the right buyers.',
    accent: 'Sell better',
    illustration: artwork.farmerProduce,
    kind: 'produce',
  },

  {
    title: 'Stronger Together',
    description:
      'Farmers, buyers, logistics and the wider agricultural network work better together.',
    accent: 'Build together',
    illustration: artwork.teamRoles,
    kind: 'team',
  },
] as const;

export function GetStartedScreen({
  navigation,
}: NativeStackScreenProps<
  AuthStackParamList,
  'GetStarted'
>) {
  const {
    width,
    height,
  } = useWindowDimensions();

  const insets =
    useSafeAreaInsets();

  const listRef =
    useRef<FlatList<number>>(null);

  const [page, setPage] =
    useState(0);

  /*
   * FARMPRISM GLOBAL SAFE-AREA RULE:
   * interactive content must remain above
   * Android system navigation.
   */
  const safeBottom =
    Math.max(
      insets.bottom,
      12,
    );

  const scale =
    Math.max(
      0.88,
      Math.min(
        1.04,
        Math.min(
          width / 392,
          height / 850,
        ),
      ),
    );

  const goToPage = (
    nextPage: number,
  ) => {
    const safePage =
      Math.max(
        0,
        Math.min(
          slides.length - 1,
          nextPage,
        ),
      );

    setPage(safePage);

    requestAnimationFrame(
      () => {
        listRef.current?.scrollToOffset(
          {
            offset:
              safePage *
              width,

            animated: true,
          },
        );
      },
    );
  };

  const handleNext = () => {
    if (
      page <
      slides.length - 1
    ) {
      goToPage(page + 1);

      return;
    }

    navigation.navigate(
      'PhoneLogin',
    );
  };


  const handleScrollEnd = (
    event: NativeSyntheticEvent<
      NativeScrollEvent
    >,
  ) => {
    if (width <= 0) {
      return;
    }

    const nextPage =
      Math.round(
        event.nativeEvent
          .contentOffset.x /
          width,
      );

    if (
      nextPage >= 0 &&
      nextPage <
        slides.length
    ) {
      setPage(nextPage);
    }
  };

  return (
    <View
      style={
        styles.root
      }
    >
      <StatusBar hidden />

      {/* Shared leaf decorations */}
      <Image
        pointerEvents="none"
        source={
          artwork.topLeftLeaves
        }
        resizeMode="contain"
        style={[
          styles.topLeftLeaves,
          {
            width:
              125 * scale,

            height:
              125 * scale,
          },
        ]}
      />

      <Image
        pointerEvents="none"
        source={
          artwork.topRightLeaves
        }
        resizeMode="contain"
        style={[
          styles.topRightLeaves,
          {
            width:
              125 * scale,

            height:
              125 * scale,
          },
        ]}
      />

      {/* Real Back control */}
    

      <FlatList
        ref={listRef}
        data={[
          0,
          1,
          2,
          3,
        ]}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={
          false
        }
        scrollEventThrottle={16}
        keyExtractor={(
          item,
        ) =>
          `farmprism-intro-${item}`
        }
        getItemLayout={(
          _,
          index,
        ) => ({
          length: width,
          offset:
            width *
            index,
          index,
        })}
        onMomentumScrollEnd={
          handleScrollEnd
        }
        renderItem={({
          item,
        }) => {
          const slide =
            slides[item];

          return (
            <View
              style={[
                styles.page,

                {
                  width,
                  height,
                },
              ]}
            >
              {/* Upper area */}
              <View
                style={[
                  styles.heroArea,

                  {
                    paddingTop:
                      Math.max(
                        insets.top,
                        6,
                      ) +
                      8 *
                        scale,
                  },
                ]}
              >
                {/* Common approved logo */}
                <Image
                  source={
                    artwork.logo
                  }
                  resizeMode="contain"
                  fadeDuration={0}
                  accessibilityLabel="FarmPrism"
                  style={{
                    width:
                      82 *
                      scale,

                    height:
                      82 *
                      scale,
                  }}
                />

                {/* Main illustration stage */}
                <View
                  style={[
                    styles.illustrationStage,

                    {
                      height:
                        height *
                        0.36,
                    },
                  ]}
                >
                  {/* Page 2 supporting sprout */}
                  {item ===
                    1 && (
                    <Image
                      pointerEvents="none"
                      source={
                        artwork.sproutingPlant
                      }
                      resizeMode="contain"
                      style={[
                        styles.phoneSprout,

                        {
                          width:
                            145 *
                            scale,

                          height:
                            115 *
                            scale,
                        },
                      ]}
                    />
                  )}

                  {/* Page 4 supporting network */}
                  {item ===
                    3 && (
                    <Image
                      pointerEvents="none"
                      source={
                        artwork.teamNetwork
                      }
                      resizeMode="contain"
                      style={[
                        styles.teamNetwork,

                        {
                          width:
                            150 *
                            scale,

                          height:
                            105 *
                            scale,
                        },
                      ]}
                    />
                  )}

                  <Image
                    source={
                      slide.illustration
                    }
                    resizeMode="contain"
                    fadeDuration={0}
                    style={[
                      styles.mainIllustration,

                      slide.kind ===
                        'farmer' && {
                        width:
                          width *
                          0.76,

                        height:
                          height *
                          0.32,
                      },

                      slide.kind ===
                        'phone' && {
                        width:
                          width *
                          0.69,

                        height:
                          height *
                          0.34,
                      },

                      slide.kind ===
                        'produce' && {
                        width:
                          width *
                          0.76,

                        height:
                          height *
                          0.34,
                      },

                      slide.kind ===
                        'team' && {
                        width:
                          width *
                          0.72,

                        height:
                          height *
                          0.32,
                      },
                    ]}
                  />
                </View>

                {/* Shared FarmPrism landscape */}
                <Image
                  pointerEvents="none"
                  source={
                    artwork.bottomLandscape
                  }
                  resizeMode="contain"
                  fadeDuration={0}
                  style={[
                    styles.landscape,

                    {
                      height:
                        100 *
                        scale,
                    },
                  ]}
                />
              </View>

              {/* Bottom native UI card */}
              <View
                style={[
                  styles.contentCard,

                  {
                    paddingBottom:
                      safeBottom +
                      14 *
                        scale,
                  },
                ]}
              >
                <View
                  style={[
                    styles.accentPill,

                    {
                      paddingHorizontal:
                        15 *
                        scale,

                      height:
                        30 *
                        scale,

                      borderRadius:
                        15 *
                        scale,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.accentText,

                      {
                        fontSize:
                          12.5 *
                          scale,
                      },
                    ]}
                  >
                    {
                      slide.accent
                    }
                  </Text>
                </View>

                <Text
                  style={[
                    styles.title,

                    {
                      fontSize:
                        27 *
                        scale,

                      lineHeight:
                        33 *
                        scale,
                    },
                  ]}
                >
                  {
                    slide.title
                  }
                </Text>

                <Text
                  style={[
                    styles.description,

                    {
                      fontSize:
                        14 *
                        scale,

                      lineHeight:
                        21 *
                        scale,
                    },
                  ]}
                >
                  {
                    slide.description
                  }
                </Text>

                {/* Real pagination */}
                <View
                  style={
                    styles.pagination
                  }
                >
                  {slides.map(
                    (
                      _,
                      dot,
                    ) => (
                      <Pressable
                        key={
                          dot
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Go to introduction screen ${
                          dot +
                          1
                        }`}
                        onPress={() =>
                          goToPage(
                            dot,
                          )
                        }
                        style={[
                          styles.paginationDot,

                          dot ===
                            page &&
                            styles.paginationDotActive,
                        ]}
                      />
                    ),
                  )}
                </View>

                {/* Real Next/Get Started button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    page ===
                    slides.length -
                      1
                      ? 'Get Started'
                      : 'Next'
                  }
                  onPress={
                    handleNext
                  }
                  style={({ pressed }) => [
                    styles.primaryButton,

                    {
                      height:
                        54 *
                        scale,

                      borderRadius:
                        14 *
                        scale,
                    },

                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,

                      {
                        fontSize:
                          16 *
                          scale,
                      },
                    ]}
                  >
                    {page ===
                    slides.length -
                      1
                      ? 'Get Started'
                      : 'Next'}
                  </Text>

                  <Text
                    style={[
                      styles.primaryButtonArrow,

                      {
                        fontSize:
                          23 *
                          scale,
                      },
                    ]}
                  >
                    →
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,

      backgroundColor:
        '#F6F8EC',

      overflow:
        'hidden',
    },

    page: {
      flex: 1,

      backgroundColor:
        '#F6F8EC',
    },

    topLeftLeaves: {
      position:
        'absolute',

      top: -18,
      left: -25,

      zIndex: 4,

      opacity: 0.92,
    },

    topRightLeaves: {
      position:
        'absolute',

      top: -18,
      right: -25,

      zIndex: 4,

      opacity: 0.72,
    },


    heroArea: {
      height: '56%',

      alignItems:
        'center',

      justifyContent:
        'flex-start',

      overflow:
        'hidden',

      position:
        'relative',
    },

    illustrationStage: {
      width: '100%',

      alignItems:
        'center',

      justifyContent:
        'center',

      position:
        'relative',

      marginTop: -1,
    },

    mainIllustration: {
      zIndex: 3,
    },

    phoneSprout: {
      position:
        'absolute',

      left: 4,
      bottom: 4,

      zIndex: 1,
    },

    teamNetwork: {
      position:
        'absolute',

      right: 3,
      bottom: 3,

      zIndex: 1,
    },

    landscape: {
      position:
        'absolute',

      left: -7,
      right: -7,
      bottom: -8,

      width: '104%',

      zIndex: 2,
    },

    contentCard: {
      flex: 1,

      width: '100%',

      alignItems:
        'center',

      paddingTop: 22,

      paddingHorizontal:
        26,

      backgroundColor:
        '#FFFDF7',

      borderTopLeftRadius:
        30,

      borderTopRightRadius:
        30,

      shadowColor:
        '#1C3924',

      shadowOpacity:
        0.08,

      shadowRadius:
        12,

      shadowOffset: {
        width: 0,
        height: -3,
      },

      elevation: 5,
    },

    accentPill: {
      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#EAF3DF',
    },

    accentText: {
      color:
        '#2E713D',

      fontWeight:
        '700',
    },

    title: {
      marginTop: 13,

      color:
        '#17372B',

      textAlign:
        'center',

      fontFamily:
        'serif',

      fontWeight:
        '700',

      paddingHorizontal:
        4,
    },

    description: {
      marginTop: 9,

      maxWidth: 340,

      color:
        '#68736B',

      textAlign:
        'center',
    },

    pagination: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

      marginTop:
        19,

      marginBottom:
        19,
    },

    paginationDot: {
      width: 8,

      height: 8,

      borderRadius: 4,

      backgroundColor:
        '#C8D1C6',
    },

    paginationDotActive: {
      width: 26,

      backgroundColor:
        '#26743C',
    },

    primaryButton: {
      width: '100%',

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#176C35',

      shadowColor:
        '#153E24',

      shadowOpacity:
        0.16,

      shadowRadius: 7,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 4,
    },

    primaryButtonText: {
      color:
        '#FFFFFF',

      fontWeight:
        '800',
    },

    primaryButtonArrow: {
      color:
        '#FFFFFF',

      marginLeft: 13,

      fontWeight:
        '500',
    },

    pressed: {
      opacity: 0.84,

      transform: [
        {
          scale: 0.992,
        },
      ],
    },
  });