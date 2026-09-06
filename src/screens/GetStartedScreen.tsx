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
  const commonStyle = [
    styles.title,
    {
      fontSize: 38 * scale,
      lineHeight: 42 * scale,
    },
  ];

  if (index === 0) {
    return (
      <Text style={commonStyle}>
        <Text style={styles.navy}>Welcome to</Text>

        {'\n'}

        <Text style={styles.green}>Farm</Text>
        <Text style={styles.brown}>Prism</Text>
      </Text>
    );
  }

  if (index === 1) {
    return (
      <Text style={commonStyle}>
        <Text style={styles.green}>Grow Smarter</Text>

        {'\n'}

        <Text style={styles.brown}>Every Season</Text>
      </Text>
    );
  }

  if (index === 2) {
    return (
      <Text style={commonStyle}>
        <Text style={styles.navy}>Fair Prices</Text>

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
          fontSize: 37 * scale,
          lineHeight: 42 * scale,
        },
      ]}
    >
      <Text style={styles.navy}>Stronger </Text>
      <Text style={styles.green}>Together</Text>
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
          height: 83 * scale,
          borderRadius: 13 * scale,
          paddingHorizontal: 10 * scale,
        },
      ]}
    >
      <View
        style={[
          styles.featureImageArea,
          {
            width: 105 * scale,
          },
        ]}
      >
        <Image
          source={image}
          resizeMode="contain"
          style={{
            width: 94 * scale,
            height: 76 * scale,
          }}
        />
      </View>

      <View style={styles.featureTextArea}>
        <Text
          style={[
            styles.featureTitle,
            {
              fontSize: 15 * scale,
              lineHeight: 19 * scale,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.featureDescription,
            {
              fontSize: 12.5 * scale,
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
  negative = false,
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
          minHeight: 43 * scale,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 21 * scale,
          width: 31 * scale,
        }}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.cropName,
          {
            fontSize: 11.5 * scale,
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
              fontSize: 11.5 * scale,
            },
          ]}
        >
          {price}
        </Text>

        <Text
          style={[
            styles.movementText,
            {
              fontSize: 10.5 * scale,
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
  onPress,
  scale,
}: {
  index: number;
  onPress: (index: number) => void;
  scale: number;
}) {
  return (
    <View style={styles.pagination}>
      {[0, 1, 2, 3].map((dot) => (
        <Pressable
          key={dot}
          accessibilityRole="button"
          accessibilityLabel={`Go to introduction screen ${
            dot + 1
          }`}
          onPress={() => onPress(dot)}
          hitSlop={8}
          style={[
            styles.paginationDot,
            {
              width: 10 * scale,
              height: 10 * scale,
              borderRadius: 5 * scale,
            },

            dot === index
              ? styles.paginationDotActive
              : styles.paginationDotIdle,
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
    0.86,
    Math.min(
      1.04,
      Math.min(
        width / 392,
        height / 850,
      ),
    ),
  );

  /*
   * Permanent FarmPrism rule:
   * interactive elements stay above
   * Android system navigation.
   */
  const safeBottom =
    Math.max(insets.bottom, 12);

  const footerHeight =
    110 * scale +
    safeBottom;

  const contentHeight =
    Math.max(
      0,
      height - footerHeight,
    );

  const landscapeHeight =
    168 * scale;

  const safeTop =
    Math.max(
      insets.top,
      0,
    );

  const goToPage = (
    nextPage: number,
  ) => {
    const safePage =
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
          safePage *
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
   * Feature cards + quote in normal flow.
   */
  if (index === 0) {
    return (
      <View
        style={[
          styles.pageOneBody,
          {
            marginTop:
              10 * scale,
          },
        ]}
      >
        <FeatureCard
          scale={scale}
          image={
            artwork.farmerPortrait
          }
          title="Sell directly to verified buyers"
          description="Get better prices for your hard work."
        />

        <FeatureCard
          scale={scale}
          image={
            artwork.sproutingPlant
          }
          title="Manage your crops with ease"
          description="Track, update and grow your produce."
        />

        <FeatureCard
          scale={scale}
          image={
            artwork.teamNetwork
          }
          title="Be part of a trusted farming community"
          description="Together for a prosperous tomorrow."
        />

        <Text
          style={[
            styles.inlineQuote,
            {
              fontSize:
                15 * scale,

              lineHeight:
                18 * scale,

              marginTop:
                5 * scale,
            },
          ]}
        >
          {'“Better Farmers\nBrighter Tomorrows”'}
        </Text>
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
              5 * scale,
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
              width * 0.82,

            height:
              Math.min(
                contentHeight *
                  0.53,

                400 * scale,
              ),
          }}
        />
      </View>
    );
  }

  /*
   * PAGE 3
   * Market artwork and quote get separate vertical zones.
   */
  if (index === 2) {
    return (
      <View
        style={[
          styles.pageThreeBody,
          {
            marginTop:
              7 * scale,
          },
        ]}
      >
        <View
          style={[
            styles.marketComposition,
            {
              height:
                245 * scale,
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
                  width * 0.52,

                height:
                  230 * scale,

                left:
                  -13 * scale,

                bottom: 0,
              },
            ]}
          />

          <View
            style={[
              styles.marketCard,
              {
                width:
                  width * 0.58,

                right:
                  10 * scale,

                top:
                  2 * scale,

                borderRadius:
                  13 * scale,

                padding:
                  10 * scale,
              },
            ]}
          >
            <View
              style={
                styles.marketHeader
              }
            >
              <Text
                style={[
                  styles.marketTitle,
                  {
                    fontSize:
                      12.5 *
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
                      10 *
                      scale,
                  },
                ]}
              >
                View All →
              </Text>
            </View>

            <MarketRow
              scale={scale}
              icon="🍅"
              crop="Tomato"
              price="₹1,420 / qtl"
              movement="↑ 2.5%"
            />

            <MarketRow
              scale={scale}
              icon="🧅"
              crop="Onion"
              price="₹1,980 / qtl"
              movement="↓ 1.3%"
              negative
            />

            <MarketRow
              scale={scale}
              icon="🌾"
              crop="Wheat"
              price="₹2,183 / qtl"
              movement="↑ 3.1%"
            />

            <MarketRow
              scale={scale}
              icon="🫛"
              crop="Soybean"
              price="₹3,200 / qtl"
              movement="↑ 0.8%"
            />
          </View>
        </View>

        <Text
          style={[
            styles.inlineQuote,
            {
              fontSize:
                15 * scale,

              lineHeight:
                18 * scale,

              marginTop:
                4 * scale,
            },
          ]}
        >
          {'Better Markets\nBrighter Tomorrows'}
        </Text>
      </View>
    );
  }

  /*
   * PAGE 4
   * Network followed by tagline instead of overlaying it.
   */
  return (
    <View
      style={[
        styles.pageFourBody,
        {
          marginTop:
            5 * scale,
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
            width * 0.74,

          height:
            275 * scale,
        }}
      />

      <Text
        style={[
          styles.togetherText,
          {
            fontSize:
              17 * scale,

            lineHeight:
              20 * scale,

            marginTop:
              -3 * scale,
          },
        ]}
      >
        {'Together\nWe Build a Better Tomorrow'}
      </Text>

      <View
        style={[
          styles.sproutDivider,
          {
            marginTop:
              4 * scale,
          },
        ]}
      >
        <View
          style={
            styles.sproutLine
          }
        />

        <Image
          source={
            artwork.sproutingPlant
          }
          resizeMode="contain"
          style={{
            width:
              25 * scale,

            height:
              25 * scale,

            marginHorizontal:
              8 * scale,
          }}
        />

        <View
          style={
            styles.sproutLine
          }
        />
      </View>
    </View>
  );
};

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <FlatList
        ref={listRef}
        data={[0, 1, 2, 3]}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        keyExtractor={(item) =>
          `get-started-${item}`
        }
        getItemLayout={(
          _,
          index,
        ) => ({
          length: width,
          offset:
            width * index,
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
            {/* Main content area */}
            <View
              style={[
                styles.contentArea,
                {
                  height:
                    contentHeight,

                  paddingTop:
                    safeTop +
                    8 * scale,
                },
              ]}
            >
              {/* Decorative leaves */}
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
                      150 * scale,

                    height:
                      145 * scale,
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
                      150 * scale,

                    height:
                      145 * scale,
                  },
                ]}
              />

              {/* Common FarmPrism logo */}
              <Image
                source={artwork.logo}
                resizeMode="contain"
                fadeDuration={0}
                accessibilityLabel="FarmPrism"
                style={[
                  styles.logo,
                  {
                    width:
                      91 * scale,

                    height:
                      91 * scale,
                  },
                ]}
              />

              <PageTitle
                index={item}
                scale={scale}
              />

              <Text
                style={[
                  styles.description,
                  {
                    fontSize:
                      15 * scale,

                    lineHeight:
                      20 * scale,

                    marginTop:
                      8 * scale,
                  },
                ]}
              >
                {
                  descriptions[
                    item
                  ]
                }
              </Text>

              {renderPageBody(
                item,
              )}

              {/* Page 4 tagline */}
              {item === 3 && (
                <View
                  style={[
                    styles.togetherArea,
                    {
                      bottom:
                        landscapeHeight -
                        4 * scale,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.togetherText,
                      {
                        fontSize:
                          18 *
                          scale,

                        lineHeight:
                          22 *
                          scale,
                      },
                    ]}
                  >
                    {'Together\nWe Build a Better Tomorrow'}
                  </Text>

                  <View style={styles.sproutDivider}>
                    <View style={styles.sproutLine} />

                    <Image
                      source={
                        artwork.sproutingPlant
                      }
                      resizeMode="contain"
                      style={{
                        width:
                          27 *
                          scale,

                        height:
                          27 *
                          scale,

                        marginHorizontal:
                          8 *
                          scale,
                      }}
                    />

                    <View style={styles.sproutLine} />
                  </View>
                </View>
              )}

              {/* Shared bottom landscape */}
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

            {/* Bottom white footer */}
            <View
              style={[
                styles.footer,
                {
                  height:
                    footerHeight,

                  paddingBottom:
                    safeBottom +
                    9 * scale,

                  paddingTop:
                    10 * scale,

                  borderTopLeftRadius:
                    28 * scale,

                  borderTopRightRadius:
                    28 * scale,
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
                style={({
                  pressed,
                }) => [
                  styles.primaryButton,
                  {
                    height:
                      54 * scale,

                    borderRadius:
                      12 * scale,

                    marginTop:
                      12 * scale,
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
                        16.5 *
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
                        25 * scale,
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor:
      '#FCFBF3',
    overflow: 'hidden',
  },

  page: {
    flex: 1,
    backgroundColor:
      '#FCFBF3',
  },

  contentArea: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  topLeftLeaves: {
    position: 'absolute',
    left: -29,
    top: -22,
    zIndex: 0,
    opacity: 0.94,
  },

  topRightLeaves: {
    position: 'absolute',
    right: -30,
    top: -23,
    zIndex: 0,
    opacity: 0.86,
  },

  logo: {
    zIndex: 3,
  },

  title: {
    width: '94%',
    marginTop: 5,

    textAlign: 'center',

    fontFamily: 'serif',
    fontWeight: '700',

    zIndex: 3,
  },

  navy: {
    color: '#102D42',
  },

  green: {
    color: '#176B35',
  },

  brown: {
    color: '#8C3515',
  },

  description: {
    width: '86%',

    color: '#4F5F6D',

    textAlign: 'center',

    zIndex: 3,
  },

  pageOneBody: {
    width: '88%',
    gap: 9,
    zIndex: 3,
  },

  featureCard: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor:
      'rgba(248,250,239,0.96)',

    borderWidth: 1,
    borderColor:
      '#E2E8D5',

    shadowColor:
      '#36543B',

    shadowOpacity: 0.08,
    shadowRadius: 6,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  featureImageArea: {
    height: '100%',

    alignItems: 'center',
    justifyContent: 'center',
  },

  featureTextArea: {
    flex: 1,
    paddingRight: 5,
  },

  featureTitle: {
    color: '#176B35',
    fontWeight: '800',
  },

  featureDescription: {
    marginTop: 3,

    color: '#66717A',
  },

  pageTwoBody: {
    flex: 1,

    width: '100%',

    alignItems: 'center',
    justifyContent: 'flex-start',

    zIndex: 3,
  },

  pageThreeBody: {
    flex: 1,

    width: '100%',

    position: 'relative',

    zIndex: 3,
  },

  marketFarmer: {
    position: 'absolute',
    zIndex: 2,
  },

  marketCard: {
    position: 'absolute',

    backgroundColor:
      'rgba(255,255,255,0.97)',

    shadowColor:
      '#27452F',

    shadowOpacity: 0.12,
    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,

    zIndex: 4,
  },

  marketHeader: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent:
      'space-between',

    paddingBottom: 5,

    borderBottomWidth: 1,

    borderBottomColor:
      '#E7ECE3',
  },

  marketTitle: {
    color: '#165C34',
    fontWeight: '800',
  },

  viewAll: {
    color: '#1A7139',
    fontWeight: '700',
  },

  marketRow: {
    flexDirection: 'row',

    alignItems: 'center',

    borderBottomWidth: 1,

    borderBottomColor:
      '#EDF0EA',
  },

  cropName: {
    flex: 1,

    color: '#24333E',

    fontWeight: '700',
  },

  priceArea: {
    alignItems:
      'flex-start',

    width: '47%',
  },

  priceText: {
    color: '#172D43',
    fontWeight: '800',
  },

  movementText: {
    marginTop: 1,
    fontWeight: '800',
  },

  positiveMovement: {
    color: '#14913C',
  },

  negativeMovement: {
    color: '#D9342B',
  },

  pageFourBody: {
    flex: 1,

    width: '100%',

    alignItems: 'center',

    zIndex: 3,
  },

  quote: {
    position: 'absolute',

    left: 0,
    right: 0,

    zIndex: 5,

    color: '#177239',

    textAlign: 'center',

    fontFamily: 'serif',

    fontStyle: 'italic',
    fontWeight: '700',
  },

  togetherArea: {
    position: 'absolute',

    left: 0,
    right: 0,

    zIndex: 5,

    alignItems: 'center',
  },

  togetherText: {
    color: '#1A3850',

    textAlign: 'center',

    fontWeight: '500',
  },

  sproutDivider: {
    width: 125,

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 5,
  },

  sproutLine: {
    flex: 1,
    height: 1,

    backgroundColor:
      '#477B4F',
  },

  landscape: {
    position: 'absolute',

    left: 0,
    right: 0,
    bottom: -1,

    width: '100%',

    zIndex: 1,
  },

  footer: {
    position: 'absolute',

    left: 0,
    right: 0,
    bottom: 0,

    zIndex: 20,

    paddingHorizontal: 22,

    backgroundColor:
      '#FFFFFF',

    shadowColor:
      '#2D4A35',

    shadowOpacity: 0.08,
    shadowRadius: 9,

    shadowOffset: {
      width: 0,
      height: -2,
    },

    elevation: 5,
  },

  pagination: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 10,
  },

  paginationDot: {},

  paginationDotIdle: {
    backgroundColor:
      '#C9D9C0',
  },

  paginationDotActive: {
    backgroundColor:
      '#16713A',
  },

  primaryButton: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      '#176C35',

    shadowColor:
      '#173F25',

    shadowOpacity: 0.16,
    shadowRadius: 7,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  primaryArrow: {
    marginLeft: 18,

    color: '#FFFFFF',
  },

  pressed: {
    opacity: 0.86,

    transform: [
      {
        scale: 0.992,
      },
    ],
  },
});