import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

const DESIGN_WIDTH = 853;
const DESIGN_HEIGHT = 1844;

const assets = {
    background: require('../../assets/4. FarmPrism_CommonLogin_Assets/login_background_farm.png'),
    logo: require('../../assets/4. FarmPrism_CommonLogin_Assets/login_farmprism_logo.png'),
    topLeftLeaves: require('../../assets/4. FarmPrism_CommonLogin_Assets/login_top_left_leaves.png'),
    topRightLeaves: require('../../assets/4. FarmPrism_CommonLogin_Assets/login_top_right_leaves.png'),
    dividerSprout: require('../../assets/4. FarmPrism_CommonLogin_Assets/login_divider_sprout.png'),
    securityShield: require('../../assets/4. FarmPrism_CommonLogin_Assets/login_security_shield.png'),
    actionLeaf: require('../../assets/4. FarmPrism_CommonLogin_Assets/login_action_leaf.png'),
};

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneLogin'>;

type ScaledBox = {
    left: number;
    top: number;
    width: number;
    height: number;
};

export function PhoneLoginScreen({ navigation }: Props) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { requestOtp, verifyOtp } = useAuth();

    const scale = width / DESIGN_WIDTH;
    const canvasHeight = DESIGN_HEIGHT * scale;
    const safeBottom = Math.max(insets.bottom, 18);
    const box = (x: number, y: number, w: number, h: number): ScaledBox => ({
        left: x * scale,
        top: y * scale,
        width: w * scale,
        height: h * scale,
    });

    const [phone, setPhone] = useState('');
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [otpSent, setOtpSent] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [busy, setBusy] = useState<'send' | 'verify' | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const otpRefs = useRef<Array<TextInput | null>>([]);

    const phoneValid = /^[6-9]\d{9}$/.test(phone);
    const otp = useMemo(() => otpDigits.join(''), [otpDigits]);
    const otpValid = otpSent && /^\d{6}$/.test(otp);

    useEffect(() => {
        if (seconds <= 0) return;

        const timer = setInterval(() => {
            setSeconds((value) => Math.max(0, value - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [seconds]);

    const clearOtp = () => {
        setOtpDigits(['', '', '', '', '', '']);
    };

    const sendOtp = async () => {
        if (!phoneValid || busy) return;

        setBusy('send');
        setMessage(null);

        try {
            const result = await requestOtp(phone);
            setPhone(result.phone.replace(/^\+91/, ''));
            clearOtp();
            setOtpSent(true);
            setSeconds(30);

            setTimeout(() => {
                otpRefs.current[0]?.focus();
            }, 150);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to send OTP. Please try again.',
            );
        } finally {
            setBusy(null);
        }
    };

    const verify = async () => {
        if (!otpValid || busy) return;

        setBusy('verify');
        setMessage(null);

        try {
            await verifyOtp(phone, otp);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to verify OTP. Please try again.',
            );
        } finally {
            setBusy(null);
        }
    };

    const updateOtpDigit = (index: number, rawValue: string) => {
        if (!otpSent) return;

        const digitsOnly = rawValue.replace(/\D/g, '');

        if (digitsOnly.length > 1) {
            const next = [...otpDigits];
            const pasted = digitsOnly.slice(0, 6 - index).split('');

            pasted.forEach((digit, offset) => {
                next[index + offset] = digit;
            });

            setOtpDigits(next);

            const nextIndex = Math.min(index + pasted.length, 5);
            otpRefs.current[nextIndex]?.focus();
            return;
        }

        const next = [...otpDigits];
        next[index] = digitsOnly.slice(-1);
        setOtpDigits(next);

        if (digitsOnly && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpBackspace = (index: number) => {
        if (!otpSent || index <= 0 || otpDigits[index]) return;

        const next = [...otpDigits];
        next[index - 1] = '';
        setOtpDigits(next);
        otpRefs.current[index - 1]?.focus();
    };

    return (
        <View style={styles.root}>
            <StatusBar hidden />

            <ImageBackground
                source={assets.background}
                resizeMode="cover"
                fadeDuration={0}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                style={[
                    styles.flex,
                    {
                        paddingBottom: safeBottom,
                    },
                ]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    contentContainerStyle={{
                        minHeight: Math.max(height - safeBottom, canvasHeight),
                    }}
                >
                    <View style={{ width, height: canvasHeight }}>
                        <Image
                            source={assets.topLeftLeaves}
                            resizeMode="contain"
                            fadeDuration={0}
                            style={[styles.absolute, box(-12, -15, 258, 210)]}
                            pointerEvents="none"
                        />

                        <Image
                            source={assets.topRightLeaves}
                            resizeMode="contain"
                            fadeDuration={0}
                            style={[styles.absolute, box(620, -12, 250, 210)]}
                            pointerEvents="none"
                        />

                        <View
                            pointerEvents="none"
                            style={[
                                styles.quoteWrap,
                                {
                                    right: 56 * scale,
                                    top: 118 * scale,
                                    width: 165 * scale,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.quote,
                                    {
                                        fontSize: 26 * scale,
                                        lineHeight: 29 * scale,
                                    },
                                ]}
                            >
                                Better{'\n'}Farmers{'\n'}Brighter{'\n'}Tomorrows
                            </Text>
                            <Text
                                style={[
                                    styles.quoteLeaf,
                                    {
                                        fontSize: 25 * scale,
                                        marginTop: 2 * scale,
                                    },
                                ]}
                            >
                                ── ❧ ──
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.card,
                                styles.absolute,
                                box(108, 311, 617, 1296),
                                {
                                    borderRadius: 54 * scale,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.absolute,
                                    box(0, 0, 617, 1296),
                                    { overflow: 'hidden', borderRadius: 54 * scale },
                                ]}
                                pointerEvents="none"
                            />

                            <View
                                style={[
                                    styles.absolute,
                                    box(50, 386, 517, 80),
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.fieldLabel,
                                        {
                                            fontSize: 24 * scale,
                                            lineHeight: 30 * scale,
                                        },
                                    ]}
                                >
                                    Phone Number
                                </Text>

                                <View
                                    style={[
                                        styles.phoneField,
                                        {
                                            height: 78 * scale,
                                            borderRadius: 18 * scale,
                                            marginTop: 12 * scale,
                                        },
                                    ]}
                                >
                                    <Text
                                        accessible={false}
                                        style={[
                                            styles.flag,
                                            {
                                                fontSize: 26 * scale,
                                                marginLeft: 22 * scale,
                                            },
                                        ]}
                                    >
                                        🇮🇳
                                    </Text>

                                    <Text
                                        style={[
                                            styles.countryCode,
                                            {
                                                fontSize: 22 * scale,
                                                marginLeft: 12 * scale,
                                            },
                                        ]}
                                    >
                                        +91
                                    </Text>

                                    <Text
                                        accessible={false}
                                        style={[
                                            styles.chevron,
                                            {
                                                fontSize: 18 * scale,
                                                marginLeft: 8 * scale,
                                            },
                                        ]}
                                    >
                                        ⌄
                                    </Text>

                                    <View
                                        style={[
                                            styles.phoneDivider,
                                            {
                                                height: 42 * scale,
                                                marginHorizontal: 18 * scale,
                                            },
                                        ]}
                                    />

                                    <TextInput
                                        value={phone}
                                        onChangeText={(value) => {
                                            setPhone(value.replace(/\D/g, '').slice(0, 10));
                                            setMessage(null);
                                            if (otpSent) {
                                                setOtpSent(false);
                                                clearOtp();
                                                setSeconds(0);
                                            }
                                        }}
                                        placeholder="Enter your mobile number"
                                        placeholderTextColor="#9AA2A8"
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        textContentType="telephoneNumber"
                                        autoComplete="tel"
                                        returnKeyType="done"
                                        underlineColorAndroid="transparent"
                                        style={[
                                            styles.phoneInput,
                                            {
                                                fontSize: 21 * scale,
                                                paddingRight: 15 * scale,
                                            },
                                        ]}
                                    />
                                </View>
                            </View>

                            {!!message && !otpSent && (
                                <Text
                                    style={[
                                        styles.errorText,
                                        styles.absolute,
                                        {
                                            ...box(50, 615, 517, 25),
                                            fontSize: 14 * scale,
                                        },
                                    ]}
                                >
                                    {message}
                                </Text>
                            )}

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Send OTP"
                                accessibilityState={{ disabled: !phoneValid || !!busy }}
                                disabled={!phoneValid || !!busy}
                                onPress={() => void sendOtp()}
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    styles.absolute,
                                    box(50, 527, 517, 85),
                                    {
                                        borderRadius: 18 * scale,
                                        opacity: !phoneValid || busy ? 0.58 : pressed ? 0.88 : 1,
                                    },
                                ]}
                            >
                                {busy === 'send' ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text
                                            style={[
                                                styles.primaryButtonText,
                                                { fontSize: 25 * scale },
                                            ]}
                                        >
                                            Send OTP
                                        </Text>
                                        <Text
                                            accessible={false}
                                            style={[
                                                styles.buttonArrow,
                                                {
                                                    fontSize: 42 * scale,
                                                    right: 28 * scale,
                                                },
                                            ]}
                                        >
                                            →
                                        </Text>
                                    </>
                                )}
                            </Pressable>

                            <View
                                style={[
                                    styles.orRow,
                                    styles.absolute,
                                    box(50, 646, 517, 48),
                                ]}
                            >
                                <View style={styles.orLine} />
                                <Text
                                    style={[
                                        styles.orText,
                                        {
                                            fontSize: 22 * scale,
                                            marginHorizontal: 20 * scale,
                                        },
                                    ]}
                                >
                                    OR
                                </Text>
                                <View style={styles.orLine} />
                            </View>

                            <Text
                                style={[
                                    styles.fieldLabel,
                                    styles.absolute,
                                    {
                                        ...box(50, 704, 250, 38),
                                        fontSize: 23 * scale,
                                        lineHeight: 30 * scale,
                                    },
                                ]}
                            >
                                Enter OTP
                            </Text>

                            <View
                                style={[
                                    styles.otpRow,
                                    styles.absolute,
                                    box(50, 752, 517, 90),
                                ]}
                            >
                                {otpDigits.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => {
                                            otpRefs.current[index] = ref;
                                        }}
                                        value={digit}
                                        editable={otpSent && !busy}
                                        onChangeText={(value) => updateOtpDigit(index, value)}
                                        onKeyPress={({ nativeEvent }) => {
                                            if (nativeEvent.key === 'Backspace') {
                                                handleOtpBackspace(index);
                                            }
                                        }}
                                        keyboardType="number-pad"
                                        textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                                        autoComplete={index === 0 ? 'sms-otp' : 'off'}
                                        selectTextOnFocus
                                        maxLength={6}
                                        underlineColorAndroid="transparent"
                                        style={[
                                            styles.otpBox,
                                            {
                                                width: 73 * scale,
                                                height: 90 * scale,
                                                borderRadius: 16 * scale,
                                                fontSize: 29 * scale,
                                                opacity: otpSent ? 1 : 0.58,
                                            },
                                        ]}
                                        accessibilityLabel={`OTP digit ${index + 1}`}
                                    />
                                ))}
                            </View>

                            {!!message && otpSent && (
                                <Text
                                    style={[
                                        styles.errorText,
                                        styles.absolute,
                                        {
                                            ...box(50, 849, 517, 28),
                                            fontSize: 14 * scale,
                                        },
                                    ]}
                                >
                                    {message}
                                </Text>
                            )}

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={
                                    seconds > 0
                                        ? `Resend OTP available in ${seconds} seconds`
                                        : 'Resend OTP'
                                }
                                accessibilityState={{ disabled: !otpSent || seconds > 0 || !!busy }}
                                disabled={!otpSent || seconds > 0 || !!busy}
                                onPress={() => void sendOtp()}
                                style={[
                                    styles.resendButton,
                                    styles.absolute,
                                    box(95, 876, 427, 42),
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.resendText,
                                        {
                                            fontSize: 18 * scale,
                                        },
                                    ]}
                                >
                                    {seconds > 0 ? (
                                        <>
                                            Didn’t receive OTP? Resend in{' '}
                                            <Text style={styles.resendAccent}>
                                                00:{String(seconds).padStart(2, '0')}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            Didn’t receive OTP?{' '}
                                            <Text style={styles.resendAccent}>Resend now</Text>
                                        </>
                                    )}
                                </Text>
                            </Pressable>

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Login"
                                accessibilityState={{ disabled: !otpValid || !!busy }}
                                disabled={!otpValid || !!busy}
                                onPress={() => void verify()}
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    styles.absolute,
                                    box(50, 949, 517, 84),
                                    {
                                        borderRadius: 18 * scale,
                                        opacity: !otpValid || busy ? 0.58 : pressed ? 0.88 : 1,
                                    },
                                ]}
                            >
                                {busy === 'verify' ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text
                                            style={[
                                                styles.primaryButtonText,
                                                { fontSize: 25 * scale },
                                            ]}
                                        >
                                            Login
                                        </Text>

                                        <Image
                                            source={assets.actionLeaf}
                                            resizeMode="contain"
                                            fadeDuration={0}
                                            pointerEvents="none"
                                            style={{
                                                position: 'absolute',
                                                right: 23 * scale,
                                                width: 42 * scale,
                                                height: 42 * scale,
                                                tintColor: '#FFFFFF',
                                            }}
                                        />
                                    </>
                                )}
                            </Pressable>

                            <View
                                style={[
                                    styles.securityCard,
                                    styles.absolute,
                                    box(50, 1070, 517, 144),
                                    {
                                        borderRadius: 18 * scale,
                                        paddingHorizontal: 24 * scale,
                                    },
                                ]}
                            >
                                <Image
                                    source={assets.securityShield}
                                    resizeMode="contain"
                                    fadeDuration={0}
                                    style={{
                                        width: 76 * scale,
                                        height: 86 * scale,
                                        marginRight: 20 * scale,
                                    }}
                                />

                                <View
                                    style={[
                                        styles.securityTextWrap,
                                        { paddingRight: 42 * scale },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.securityTitle,
                                            {
                                                fontSize: 21 * scale,
                                                marginBottom: 7 * scale,
                                            },
                                        ]}
                                    >
                                        Secure & Trusted
                                    </Text>

                                    <Text
                                        style={[
                                            styles.securityDescription,
                                            {
                                                fontSize: 15 * scale,
                                                lineHeight: 22 * scale,
                                            },
                                        ]}
                                    >
                                        Your data is protected with end-to-end{'\n'}
                                        encryption and secure authentication.
                                    </Text>
                                </View>

                                <Image
                                    source={assets.actionLeaf}
                                    resizeMode="contain"
                                    fadeDuration={0}
                                    pointerEvents="none"
                                    style={{
                                        position: 'absolute',
                                        right: 18 * scale,
                                        bottom: 15 * scale,
                                        width: 42 * scale,
                                        height: 42 * scale,
                                    }}
                                />
                            </View>

                            <View
                                style={[
                                    styles.signupRow,
                                    styles.absolute,
                                    box(104, 1245, 409, 42),
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.signupPrefix,
                                        {
                                            fontSize: 20 * scale,
                                        },
                                    ]}
                                >
                                    Don’t have an account?
                                </Text>

                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Sign Up"
                                    hitSlop={8}
                                    onPress={() => navigation.navigate('SignUp')}
                                >
                                    <Text
                                        style={[
                                            styles.signupLink,
                                            {
                                                fontSize: 20 * scale,
                                                marginLeft: 12 * scale,
                                            },
                                        ]}
                                    >
                                        Sign Up
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        <Image
                            source={assets.logo}
                            resizeMode="contain"
                            fadeDuration={0}
                            accessibilityLabel="FarmPrism"
                            style={[styles.absolute, box(284, 142, 285, 285)]}
                        />

                        <View
                            pointerEvents="none"
                            style={[
                                styles.absolute,
                                box(160, 435, 533, 182),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.welcomeTitle,
                                    {
                                        fontSize: 44 * scale,
                                        lineHeight: 52 * scale,
                                    },
                                ]}
                            >
                                Welcome to
                            </Text>

                            <Text
                                style={[
                                    styles.brandTitle,
                                    {
                                        fontSize: 63 * scale,
                                        lineHeight: 70 * scale,
                                    },
                                ]}
                            >
                                <Text style={styles.brandGreen}>Farm</Text>
                                <Text style={styles.brandBrown}>Prism</Text>
                            </Text>

                            <Text
                                style={[
                                    styles.subtitle,
                                    {
                                        fontSize: 22 * scale,
                                        lineHeight: 30 * scale,
                                        marginTop: 4 * scale,
                                    },
                                ]}
                            >
                                From Soil to Sell, We Grow Together.
                            </Text>
                        </View>

                        <Image
                            source={assets.dividerSprout}
                            resizeMode="contain"
                            fadeDuration={0}
                            pointerEvents="none"
                            style={[styles.absolute, box(329, 625, 195, 49)]}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#E8EDD9',
    },
    flex: {
        flex: 1,
    },
    absolute: {
        position: 'absolute',
    },
    card: {
        backgroundColor: '#FFFEF8',
        shadowColor: '#28451E',
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    quoteWrap: {
        position: 'absolute',
        alignItems: 'center',
    },
    quote: {
        textAlign: 'center',
        color: '#0A4C2B',
        fontFamily: Platform.select({
            ios: 'Georgia',
            android: 'serif',
            default: 'serif',
        }),
        fontStyle: 'italic',
        fontWeight: '600',
    },
    quoteLeaf: {
        color: '#0B6532',
        textAlign: 'center',
    },
    welcomeTitle: {
        textAlign: 'center',
        color: '#102D3F',
        fontFamily: Platform.select({
            ios: 'Georgia',
            android: 'serif',
            default: 'serif',
        }),
        fontWeight: '700',
        includeFontPadding: false,
    },
    brandTitle: {
        textAlign: 'center',
        fontFamily: Platform.select({
            ios: 'Georgia',
            android: 'serif',
            default: 'serif',
        }),
        fontWeight: '700',
        includeFontPadding: false,
    },
    brandGreen: {
        color: '#0B5B2A',
    },
    brandBrown: {
        color: '#7A2E08',
    },
    subtitle: {
        textAlign: 'center',
        color: '#526170',
        includeFontPadding: false,
    },
    fieldLabel: {
        color: '#10293D',
        fontWeight: '700',
        includeFontPadding: false,
    },
    phoneField: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C9CFCC',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    flag: {
        includeFontPadding: false,
    },
    countryCode: {
        color: '#10293D',
        fontWeight: '700',
    },
    chevron: {
        color: '#304A5D',
    },
    phoneDivider: {
        width: 1,
        backgroundColor: '#CCD2D1',
    },
    phoneInput: {
        flex: 1,
        height: '100%',
        color: '#152D3B',
        paddingVertical: 0,
        includeFontPadding: false,
    },
    primaryButton: {
        backgroundColor: '#2B7A32',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#28451E',
        shadowOpacity: 0.16,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        includeFontPadding: false,
    },
    buttonArrow: {
        position: 'absolute',
        color: '#FFFFFF',
        fontWeight: '300',
    },
    orRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#BEC7C5',
    },
    orText: {
        color: '#10293D',
        fontWeight: '700',
    },
    otpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    otpBox: {
        borderWidth: 1,
        borderColor: '#C9CFCC',
        backgroundColor: '#FFFFFF',
        textAlign: 'center',
        color: '#10293D',
        fontWeight: '600',
        paddingVertical: 0,
    },
    resendButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    resendText: {
        color: '#5C6872',
        textAlign: 'center',
        includeFontPadding: false,
    },
    resendAccent: {
        color: '#0C6A2D',
        fontWeight: '700',
    },
    securityCard: {
        backgroundColor: '#F5F7DF',
        borderWidth: 1,
        borderColor: '#E2E6C5',
        flexDirection: 'row',
        alignItems: 'center',
    },
    securityTextWrap: {
        flex: 1,
    },
    securityTitle: {
        color: '#10293D',
        fontWeight: '700',
        includeFontPadding: false,
    },
    securityDescription: {
        color: '#21353F',
        includeFontPadding: false,
    },
    signupRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signupPrefix: {
        color: '#10293D',
        includeFontPadding: false,
    },
    signupLink: {
        color: '#14632D',
        fontWeight: '700',
        includeFontPadding: false,
    },
    errorText: {
        color: '#B3261E',
        textAlign: 'left',
        includeFontPadding: false,
    },
});
