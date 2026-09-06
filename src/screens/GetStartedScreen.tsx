import { useRef } from 'react';

import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';

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

  betterFarmersQuote: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_quote_better_farmers.png',
  ),

  betterMarketsQuote: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_quote_better_markets.png',
  ),

  togetherTomorrow: require(
    '../../assets/3. FarmPrism_Get_started_Assets/getstarted_together_tomorrow.png',
  ),
};

const descriptions = [
  'From Soil to Sell, We Grow Together.',

  'Track your crops, monitor progress and get insights to improve yield and quality.',

  'Connect directly with buyers, explore live market rates and get the best value for your produce.',

  'Join a trusted community of farmers, FPOs, buyers and partners for a sustainable future.',
] as const;

function PageTitle({
  index,
  scale,
}: {
  index: number;
  scale: number;
}) {
  if (index === 0) {
    return (
      <Text
        style={[
          styles.title,
          {
            fontSize: 34 * scale,
            lineHeight: 38 * scale,
          },
        ]}
      >
        <Text style={styles.navy}>
          Welcome to
        </Text>

        {'\n'}

        <Text style={styles.green}>
          Farm
        </Text>

        <Text style={styles.brown}>
          Prism
        </Text>
      </Text>
    );
  }

  if (index === 1) {
    return (
      <Text
        style={[
          styles.title,
          {
            fontSize: 34 * scale,
            lineHeight: 38 * scale,
          },
        ]}
      >
        <Text style={styles.green}>
          Grow Smarter
        </Text>

        {'\n'}

        <Text style={styles.brown}>
          Every Season
        </Text>
      </Text>
    );
  }

  if (index === 2) {
    return (
      <Text
        style={[
          styles.title,
          {
            fontSize: 33 * scale,
            lineHeight: 37 * scale,
          },
        ]}
      >
        <Text style={styles.navy}>
          Fair Prices
        </Text>

        {'\n'}

        <Text style={styles.green}>
          Real Opportunities
        </Text>
      </Text>
    );
  }

  return (
    <Text
      style={[
        styles.title,
        {
          fontSize: 34 * scale,
          lineHeight: 38 * scale,
        },
      ]}
    >
      <Text style={styles.navy}>
        Stronger{' '}
      </Text>

      <Text style={styles.green}>
        Together
      </Text>
    </Text>
  );
}

function FeatureCard({
  image,
  title,
  description,
  scale,
}: {
  image: ImageSourcePropType;
  title: string;
  description: string;
  scale: number;
}) {
  return (
    <View
      style={[
        styles.featureCard,
        {
          height: 92 * scale,
          borderRadius: 13 * scale,
        },
      ]}
    >
      <View
        style={[
          styles.featureArtworkArea,
          {
            width: 118 * scale,
          },
        ]}
      >
        <Image
          source={image}
          resizeMode="contain"
          fadeDuration={0}
          style={{
            width: 108 * scale,
            height: 87 * scale,
          }}
        />
      </View>

      <View style={styles.featureCopy}>
        <Text
          style={[
            styles.featureTitle,
            {
              fontSize: 14.5 * scale,
              lineHeight: 18 * scale,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.featureDescription,
            {
              fontSize: 12.3 * scale,
              lineHeight: 16 * scale,
            },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function MarketRow({
  icon,
  crop,
  price,
  movement,
  negative,
  scale,
}: {
  icon: string;
  crop: string;
  price: string;
  movement: string;
  negative?: boolean;
  scale: number;
}) {
  return (
    <View
      style={[
        styles.marketRow,
        {
          minHeight: 40 * scale,
        },
      ]}
    >
      <Text
        style={{
          width: 29 * scale,
          fontSize: 19 * scale,
        }}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.cropName,
          {
            fontSize: 10.8 * scale,
          },
        ]}
      >
        {crop}
      </Text>

      <View style={styles.priceArea}>
        <Text
          style={[
            styles.priceText,
            {
              fontSize: 10.8 * scale,
            },
          ]}
        >
          {price}
        </Text>

        <Text
          style={[
            styles.movementText,
            {
              fontSize: 9.8 * scale,
            },

            negative
              ? styles.negativeMovement
              : styles.positiveMovement,
          ]}
        >
          {movement}
        </Text>
      </View>
    </View>
  );
}

function Pagination({
  index,
  scale,
  onPress,
}: {
  index: number;
  scale: number;
  onPress: (index: number) => void;
}) {
  return (
    <View style={styles.pagination}>
      {[0, 1, 2, 3].map((dot) => (
        <Pressable
          key={dot}
          hitSlop={8}
          onPress={() => onPress(dot)}
          accessibilityRole="button"
          accessibilityLabel={`Go to introduction page ${
            dot + 1
          }`}
          style={[
            {
              width: 9 * scale,
              height: 9 * scale,
              borderRadius: 999,
            },

            dot === index
              ? styles.paginationDotActive
              : styles.paginationDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

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

  const insets = useSafeAreaInsets();

  const listRef =
    useRef<FlatList<number>>(null);

  const scale = Math.max(
    0.88,
    Math.min(
      1.04,
      Math.min(
        width / 392,
        height / 850,
      ),
    ),
  );

  /*
   * Keep all important content above
   * Android system navigation.
   */
  const safeBottom =
    Math.max(
      insets.bottom,
      12,
    );

  /*
   * MUCH smaller footer.
   *
   * This fixes the huge white area
   * visible in the current screenshot.
   */
  const footerHeight =
    76 * scale +
    safeBottom;

  const contentHeight =
    height -
    footerHeight;

  /*
   * Landscape occupies a proper lower
   * portion of the artwork instead of
   * appearing as a tiny banner.
   */
  const landscapeHeight =
    Math.min(
      215 * scale,
      contentHeight * 0.27,
    );

  const safeTop =
    Math.max(
      insets.top,
      0,
    );

  const goToPage = (
    nextPage: number,
  ) => {
    const target =
      Math.max(
        0,
        Math.min(
          3,
          nextPage,
        ),
      );

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset:
          target *
          width,

        animated: true,
      });
    });
  };

  const continueFromPage = (
    index: number,
  ) => {
    if (index < 3) {
      goToPage(index + 1);

      return;
    }

    navigation.navigate(
      'PhoneLogin',
    );
  };

  const renderPageBody = (
    index: number,
  ) => {
    /*
     * PAGE 1
     */
    if (index === 0) {
      return (
        <View
          style={[
            styles.pageOneBody,
            {
              marginTop:
                12 * scale,
            },
          ]}
        >
          <FeatureCard
            image={
              artwork.farmerPortrait
            }
            scale={scale}
            title="Sell directly to verified buyers"
            description="Get better prices for your hard work."
          />

          <FeatureCard
            image={
              artwork.sproutingPlant
            }
            scale={scale}
            title="Manage your crops with ease"
            description="Track, update and grow your produce."
          />

          <FeatureCard
            image={
              artwork.teamNetwork
            }
            scale={scale}
            title="Be part of a trusted farming community"
            description="Together for a prosperous tomorrow."
          />

          <Image
            source={
              artwork.betterFarmersQuote
            }
            resizeMode="contain"
            fadeDuration={0}
            style={{
              width:
                250 * scale,

              height:
                71 * scale,

              marginTop:
                1 * scale,

              zIndex: 5,
            }}
          />
        </View>
      );
    }

    /*
     * PAGE 2
     */
    if (index === 1) {
      return (
        <View
          style={[
            styles.pageTwoBody,
            {
              marginTop:
                9 * scale,
            },
          ]}
        >
          <Image
            source={
              artwork.producePhone
            }
            resizeMode="contain"
            fadeDuration={0}
            style={{
              width:
                width * 0.88,

              height:
                contentHeight *
                0.57,
            }}
          />
        </View>
      );
    }

    /*
     * PAGE 3
     */
    if (index === 2) {
      return (
        <View
          style={[
            styles.pageThreeBody,
            {
              marginTop:
                11 * scale,
            },
          ]}
        >
          <View
            style={[
              styles.marketComposition,
              {
                height:
                  270 * scale,
              },
            ]}
          >
            <Image
              source={
                artwork.farmerProduce
              }
              resizeMode="contain"
              fadeDuration={0}
              style={[
                styles.marketFarmer,
                {
                  width:
                    width *
                    0.58,

                  height:
                    270 *
                    scale,

                  left:
                    -18 *
                    scale,

                  bottom: 0,
                },
              ]}
            />

            <View
              style={[
                styles.marketCard,
                {
                  width:
                    width *
                    0.59,

                  right:
                    10 *
                    scale,

                  top:
                    8 *
                    scale,

                  borderRadius:
                    12 *
                    scale,

                  padding:
                    9 *
                    scale,
                },
              ]}
            >
              <View style={styles.marketHeader}>
                <Text
                  style={[
                    styles.marketTitle,
                    {
                      fontSize:
                        12 *
                        scale,
                    },
                  ]}
                >
                  Live Market Price
                </Text>

                <Text
                  style={[
                    styles.viewAll,
                    {
                      fontSize:
                        9.2 *
                        scale,
                    },
                  ]}
                >
                  View All →
                </Text>
              </View>

              <MarketRow
                icon="🍅"
                crop="Tomato"
                price="₹1,420 / qtl"
                movement="↑ 2.5%"
                scale={scale}
              />

              <MarketRow
                icon="🧅"
                crop="Onion"
                price="₹1,980 / qtl"
                movement="↓ 1.3%"
                negative
                scale={scale}
              />

              <MarketRow
                icon="🌾"
                crop="Wheat"
                price="₹2,183 / qtl"
                movement="↑ 3.1%"
                scale={scale}
              />

              <MarketRow
                icon="🫛"
                crop="Soybean"
                price="₹3,200 / qtl"
                movement="↑ 0.8%"
                scale={scale}
              />
            </View>
          </View>

          <Image
            source={
              artwork.betterMarketsQuote
            }
            resizeMode="contain"
            fadeDuration={0}
            style={{
              width:
                245 * scale,

              height:
                70 * scale,

              marginTop:
                -2 * scale,

              zIndex: 5,
            }}
          />
        </View>
      );
    }

    /*
     * PAGE 4
     */
    return (
      <View
        style={[
          styles.pageFourBody,
          {
            marginTop:
              6 * scale,
          },
        ]}
      >
        <Image
          source={
            artwork.teamRoles
          }
          resizeMode="contain"
          fadeDuration={0}
          style={{
            width:
              width * 0.83,

            height:
              315 * scale,
          }}
        />

        <Image
          source={
            artwork.togetherTomorrow
          }
          resizeMode="contain"
          fadeDuration={0}
          style={{
            width:
              285 * scale,

            height:
              83 * scale,

            marginTop:
              -8 * scale,

            zIndex: 5,
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <FlatList
        ref={listRef}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        data={[
          0,
          1,
          2,
          3,
        ]}
        keyExtractor={(item) =>
          `farmprism-get-started-${item}`
        }
        showsHorizontalScrollIndicator={false}
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
        renderItem={({ item }) => (
          <View
            style={[
              styles.page,
              {
                width,
                height,
              },
            ]}
          >
            <View
              style={[
                styles.contentArea,
                {
                  height:
                    contentHeight,

                  paddingTop:
                    safeTop +
                    27 *
                    scale,
                },
              ]}
            >
              {/* LEFT LEAVES */}

              <Image
                pointerEvents="none"
                source={
                  artwork.topLeftLeaves
                }
                resizeMode="contain"
                fadeDuration={0}
                style={[
                  styles.topLeftLeaves,
                  {
                    width:
                      155 *
                      scale,

                    height:
                      150 *
                      scale,
                  },
                ]}
              />

              {/* RIGHT LEAVES */}

              <Image
                pointerEvents="none"
                source={
                  artwork.topRightLeaves
                }
                resizeMode="contain"
                fadeDuration={0}
                style={[
                  styles.topRightLeaves,
                  {
                    width:
                      155 *
                      scale,

                    height:
                      150 *
                      scale,
                  },
                ]}
              />

              {/* LOGO */}

              <Image
                source={artwork.logo}
                resizeMode="contain"
                fadeDuration={0}
                accessibilityLabel="FarmPrism"
                style={{
                  width:
                    96 * scale,

                  height:
                    96 * scale,

                  zIndex: 5,
                }}
              />

              {/* TITLE */}

              <PageTitle
                index={item}
                scale={scale}
              />

              {/* DESCRIPTION */}

              <Text
                style={[
                  styles.description,
                  {
                    fontSize:
                      14.2 *
                      scale,

                    lineHeight:
                      19 *
                      scale,

                    marginTop:
                      7 *
                      scale,
                  },
                ]}
              >
                {
                  descriptions[
                    item
                  ]
                }
              </Text>

              {/* MAIN PAGE ARTWORK */}

              {renderPageBody(
                item,
              )}

              {/* LANDSCAPE */}

              <Image
                pointerEvents="none"
                source={
                  artwork.bottomLandscape
                }
                resizeMode="cover"
                fadeDuration={0}
                style={[
                  styles.landscape,
                  {
                    height:
                      landscapeHeight,
                  },
                ]}
              />
            </View>

            {/* WHITE BOTTOM PANEL */}

            <View
              style={[
                styles.footer,
                {
                  height:
                    footerHeight,

                  paddingTop:
                    6 *
                    scale,

                  paddingBottom:
                    safeBottom +
                    5 *
                    scale,

                  borderTopLeftRadius:
                    29 *
                    scale,

                  borderTopRightRadius:
                    29 *
                    scale,
                },
              ]}
            >
              <Pagination
                index={item}
                scale={scale}
                onPress={goToPage}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  item === 3
                    ? 'Get Started'
                    : 'Next'
                }
                onPress={() =>
                  continueFromPage(
                    item,
                  )
                }
                style={({ pressed }) => [
                  styles.primaryButton,

                  {
                    height:
                      47 *
                      scale,

                    borderRadius:
                      11 *
                      scale,

                    marginTop:
                      7 *
                      scale,
                  },

                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    {
                      fontSize:
                        15.5 *
                        scale,
                    },
                  ]}
                >
                  {item === 3
                    ? 'Get Started'
                    : 'Next'}
                </Text>

                <Text
                  style={[
                    styles.primaryArrow,
                    {
                      fontSize:
                        22 *
                        scale,

                      right:
                        22 *
                        scale,
                    },
                  ]}
                >
                  →
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    root: {
      flex: 1,

      backgroundColor:
        '#FCFBF3',

      overflow:
        'hidden',
    },

    page: {
      flex: 1,

      backgroundColor:
        '#FCFBF3',
    },

    contentArea: {
      width: '100%',

      position:
        'relative',

      alignItems:
        'center',

      overflow:
        'hidden',
    },

    topLeftLeaves: {
      position:
        'absolute',

      left: -31,
      top: -22,

      zIndex: 1,

      opacity: 0.95,
    },

    topRightLeaves: {
      position:
        'absolute',

      right: -31,
      top: -22,

      zIndex: 1,

      opacity: 0.9,
    },

    title: {
      width: '94%',

      marginTop: 14,

      textAlign:
        'center',

      fontFamily:
        'serif',

      fontWeight:
        '700',

      zIndex: 5,
    },

    navy: {
      color:
        '#102D42',
    },

    green: {
      color:
        '#176B35',
    },

    brown: {
      color:
        '#8C3515',
    },

    description: {
      width: '86%',

      textAlign:
        'center',

      color:
        '#536575',

      zIndex: 5,
    },

    /*
     * PAGE 1
     */

    pageOneBody: {
      width: '88%',

      alignItems:
        'center',

      gap: 8,

      zIndex: 5,
    },

    featureCard: {
      width: '100%',

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        'rgba(249,250,241,0.97)',

      borderWidth: 1,

      borderColor:
        '#DFE7D4',

      shadowColor:
        '#304F37',

      shadowOpacity:
        0.08,

      shadowRadius:
        5,

      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: 2,
    },

    featureArtworkArea: {
      height: '100%',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    featureCopy: {
      flex: 1,

      justifyContent:
        'center',

      paddingRight: 8,
    },

    featureTitle: {
      color:
        '#176B35',

      fontWeight:
        '800',
    },

    featureDescription: {
      marginTop: 3,

      color:
        '#66737B',
    },

    /*
     * PAGE 2
     */

    pageTwoBody: {
      flex: 1,

      width: '100%',

      alignItems:
        'center',

      justifyContent:
        'flex-start',

      zIndex: 5,
    },

    /*
     * PAGE 3
     */

    pageThreeBody: {
      width: '100%',

      alignItems:
        'center',

      zIndex: 5,
    },

    marketComposition: {
      width: '100%',

      position:
        'relative',
    },

    marketFarmer: {
      position:
        'absolute',

      zIndex: 3,
    },

    marketCard: {
      position:
        'absolute',

      zIndex: 5,

      backgroundColor:
        'rgba(255,255,255,0.98)',

      shadowColor:
        '#284731',

      shadowOpacity:
        0.13,

      shadowRadius:
        7,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 4,
    },

    marketHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingBottom: 5,

      borderBottomWidth:
        1,

      borderBottomColor:
        '#E8ECE5',
    },

    marketTitle: {
      color:
        '#165E34',

      fontWeight:
        '800',
    },

    viewAll: {
      color:
        '#17723A',

      fontWeight:
        '700',
    },

    marketRow: {
      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth:
        1,

      borderBottomColor:
        '#EDF0E9',
    },

    cropName: {
      flex: 1,

      color:
        '#263844',

      fontWeight:
        '700',
    },

    priceArea: {
      width: '48%',

      alignItems:
        'flex-start',
    },

    priceText: {
      color:
        '#162F44',

      fontWeight:
        '800',
    },

    movementText: {
      marginTop: 1,

      fontWeight:
        '800',
    },

    positiveMovement: {
      color:
        '#14913C',
    },

    negativeMovement: {
      color:
        '#D9352B',
    },

    /*
     * PAGE 4
     */

    pageFourBody: {
      width: '100%',

      alignItems:
        'center',

      zIndex: 5,
    },

    /*
     * SHARED LANDSCAPE
     */

    landscape: {
      position:
        'absolute',

      left: -8,
      right: -8,
      bottom: -1,

      width: '104%',

      zIndex: 2,
    },

    /*
     * FOOTER
     */

    footer: {
      position:
        'absolute',

      left: 0,
      right: 0,
      bottom: 0,

      zIndex: 20,

      paddingHorizontal:
        22,

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#294732',

      shadowOpacity:
        0.08,

      shadowRadius:
        7,

      shadowOffset: {
        width: 0,
        height: -2,
      },

      elevation: 5,
    },

    pagination: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 10,
    },

    paginationDotInactive: {
      backgroundColor:
        '#C9D9C0',
    },

    paginationDotActive: {
      backgroundColor:
        '#14733A',
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
        '#183F25',

      shadowOpacity:
        0.16,

      shadowRadius:
        6,

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

    primaryArrow: {
      position:
        'absolute',

      color:
        '#FFFFFF',
    },

    buttonPressed: {
      opacity: 0.88,

      transform: [
        {
          scale: 0.993,
        },
      ],
    },
  });*/

    footer: {
      position:
        'absolute',

      left: 0,
      right: 0,
      bottom: 0,

      zIndex: 20,

      paddingHorizontal:
        22,

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#294732',

      shadowOpacity:
        0.08,

      shadowRadius:
        7,

      shadowOffset: {
        width: 0,
        height: -2,
      },

      elevation: 5,
    },

    pagination: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 10,
    },

    paginationDotInactive: {
      backgroundColor:
        '#C9D9C0',
    },

    paginationDotActive: {
      backgroundColor:
        '#14733A',
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
        '#183F25',

      shadowOpacity:
        0.16,

      shadowRadius:
        6,

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

    primaryArrow: {
      position:
        'absolute',

      color:
        '#FFFFFF',
    },

    buttonPressed: {
      opacity: 0.88,

      transform: [
        {
          scale: 0.993,
        },
      ],
    },
  });*/

    footer: {
      position:
        'absolute',

      left: 0,
      right: 0,
      bottom: 0,

      zIndex: 20,

      paddingHorizontal:
        22,

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#294732',

      shadowOpacity:
        0.08,

      shadowRadius:
        7,

      shadowOffset: {
        width: 0,
        height: -2,
      },

      elevation: 5,
    },

    pagination: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 10,
    },

    paginationDotInactive: {
      backgroundColor:
        '#C9D9C0',
    },

    paginationDotActive: {
      backgroundColor:
        '#14733A',
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
        '#183F25',

      shadowOpacity:
        0.16,

      shadowRadius:
        6,

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

    primaryArrow: {
      position:
        'absolute',

      color:
        '#FFFFFF',
    },

    buttonPressed: {
      opacity: 0.88,

      transform: [
        {
          scale: 0.993,
        },
      ],
    },
  });*/

    footer: {
      position:
        'absolute',

      left: 0,
      right: 0,
      bottom: 0,

      zIndex: 20,

      paddingHorizontal:
        22,

      backgroundColor:
        '#FFFFFF',

      shadowColor:
        '#294732',

      shadowOpacity:
        0.08,

      shadowRadius:
        7,

      shadowOffset: {
        width: 0,
        height: -2,
      },

      elevation: 5,
    },

    pagination: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 10,
    },

    paginationDotInactive: {
      backgroundColor:
        '#C9D9C0',
    },

    paginationDotActive: {
      backgroundColor:
        '#14733A',
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
        '#183F25',

      shadowOpacity:
        0.16,

      shadowRadius:
        6,

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

    primaryArrow: {
      position:
        'absolute',

      color:
        '#FFFFFF',
    },

    buttonPressed: {
      opacity: 0.88,

      transform: [
        {
          scale: 0.993,
        },
      ],
    },
  });