import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, ImageBackground, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigationProp } from '@react-navigation/native';
import { BrandMark, Field, InlineMessage, PrimaryButton, ScreenIntro, ScreenLayout, SecondaryButton, TextButton } from '../components/PhaseOneUI';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useRole } from '../hooks/useRole';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import type { ApplicationRole } from '../types/role';

const getStartedSlides = [
  require('../../assets/2a_intro.png'),
  require('../../assets/2b_intro.png'),
  require('../../assets/2c_intro.png'),
  require('../../assets/2d_intro.png'),
] as const;
const onboardingPageStyle = { flex: 1, backgroundColor: '#FAFDF8', overflow: 'hidden' as const };
const onboardingImageStyle = { width: '100%', height: '100%' } as const;
const languageSelectorImage = require('../../assets/1a.lang sel.png');
const languageSelectorImageStyle = { width: '100%', height: '100%' } as const;
const languageSelectorStyles = StyleSheet.create({
 languageBackHit:{position:'absolute',left:'6%',top:'74%',width:'34%',height:'6%'},
 languageEnglishHit:{position:'absolute',left:'6%',right:'6%',top:'31.5%',height:'10.5%'},
 languageHindiHit:{position:'absolute',left:'6%',right:'6%',top:'43.5%',height:'10.5%'},
 languageMarathiHit:{position:'absolute',left:'6%',right:'6%',top:'55.5%',height:'10.5%'},
 languageContinueHit:{position:'absolute',right:'6%',top:'74%',width:'50%',height:'6%'},
});
const languageRowMaskStyles = StyleSheet.create({
 englishTop:{position:'absolute',left:'6.5%',right:'6.5%',top:'32.2%',height:'0.25%',backgroundColor:'#F7FAF1'},
 englishBottom:{position:'absolute',left:'6.5%',right:'6.5%',top:'42.0%',height:'0.25%',backgroundColor:'#F7FAF1'},
 englishLeft:{position:'absolute',left:'6.5%',top:'32.2%',width:'0.25%',height:'10%',backgroundColor:'#F7FAF1'},
 englishRight:{position:'absolute',right:'6.5%',top:'32.2%',width:'0.25%',height:'10%',backgroundColor:'#F7FAF1'},
 radioEnglish:{position:'absolute',right:'9.5%',top:'35.0%',width:'6.5%',aspectRatio:1,borderRadius:999,backgroundColor:'#F7FAF1',alignItems:'center',justifyContent:'center'},
 radioHindi:{position:'absolute',right:'9.5%',top:'47.0%',width:'6.5%',aspectRatio:1,borderRadius:999,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'},
 radioMarathi:{position:'absolute',right:'9.5%',top:'59.0%',width:'6.5%',aspectRatio:1,borderRadius:999,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'},
 selectedRadio:{borderWidth:3,borderColor:'#146A34'},
 unselectedRadio:{borderWidth:3,borderColor:'#8A949A'},
 radioDot:{width:'56%',height:'56%',borderRadius:999,backgroundColor:'#146A34'},
});
const getStartedActionStyles = StyleSheet.create({
 actionLayer:{position:'absolute',left:0,right:0,bottom:0,height:'12.5%',backgroundColor:'#FFFFFF',borderTopLeftRadius:48,borderTopRightRadius:48,zIndex:2},
 actionDots:{position:'absolute',left:'38%',right:'38%',top:'8%',height:'13%',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 dot:{width:14,height:14,borderRadius:999,backgroundColor:'#C4D4C1'},
 activeDot:{backgroundColor:'#146A34'},
 fixedContinue:{position:'absolute',left:'5.5%',right:'5.5%',top:'32%',height:'43%',borderRadius:26,backgroundColor:'#207A35',alignItems:'center',justifyContent:'center'},
 fixedContinueLabel:{color:'#FFFFFF',fontSize:20,fontWeight:'600'},
 fixedContinueArrow:{color:'#FFFFFF',fontSize:34,lineHeight:34,marginLeft:10},
});
const loginImage = require('../../assets/3.mainlogin.png');
const roleImage = require('../../assets/4.select role.png');

function DesignImage({source,children}:{source:any;children:React.ReactNode}){return <View style={styles.canvas}><StatusBar hidden/><ImageBackground source={source} resizeMode="cover" fadeDuration={0} style={styles.background}>{children}</ImageBackground></View>}

function BackButton({onPress}:{onPress:()=>void}){return <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} onPress={onPress} style={styles.backButton}><Text style={styles.backButtonLabel}>‹</Text></Pressable>}

export function GetStartedScreen({navigation}:NativeStackScreenProps<AuthStackParamList,'GetStarted'>){
 const {width,height}=useWindowDimensions();
 const pagerRef=useRef<FlatList<number>>(null);
 const [page,setPage]=useState(0);
 const continueFromPage=()=>{if(page===getStartedSlides.length-1){navigation.navigate('PhoneLogin');return}pagerRef.current?.scrollToIndex({index:page+1,animated:true})};
 return <View style={styles.canvas}><StatusBar hidden/><FlatList
   ref={pagerRef}
   data={getStartedSlides}
   horizontal
   pagingEnabled
   showsHorizontalScrollIndicator={false}
   keyExtractor={(_,index)=>String(index)}
   getItemLayout={(_,index)=>({length:width,offset:width*index,index})}
   onMomentumScrollEnd={event=>setPage(Math.round(event.nativeEvent.contentOffset.x/width))}
   renderItem={({item})=><View style={[onboardingPageStyle,{width,height}]}> 
      <Image source={item} resizeMode="cover" style={onboardingImageStyle}/>
    <Pressable style={styles.welcomeSkip} onPress={()=>navigation.navigate('PhoneLogin')} accessibilityRole="button" accessibilityLabel="Skip"/>
   </View>}
   />
   <View pointerEvents="box-none" style={getStartedActionStyles.actionLayer}>
     <View style={getStartedActionStyles.actionDots} pointerEvents="none">{getStartedSlides.map((_,index)=><View key={index} style={[getStartedActionStyles.dot,index===page&&getStartedActionStyles.activeDot]}/>)}</View>
     <Pressable style={getStartedActionStyles.fixedContinue} onPress={continueFromPage} accessibilityRole="button" accessibilityLabel="Continue">
       <View style={{flexDirection:'row',alignItems:'center'}}><Text style={getStartedActionStyles.fixedContinueLabel}>Get Started</Text><Text style={getStartedActionStyles.fixedContinueArrow}>→</Text></View>
     </Pressable>
   </View>
 </View>
}

export function LanguageSelectionScreen({navigation}:NativeStackScreenProps<AuthStackParamList,'LanguageSelection'>){
 const {language,setLanguage,supportedLanguages}=useLanguage();
 const saveAndContinue=async()=>{await setLanguage(language);navigation.navigate('GetStarted')};
 return <View style={styles.canvas}><StatusBar hidden/><Image source={languageSelectorImage} resizeMode="cover" style={languageSelectorImageStyle}/><View pointerEvents="none" style={StyleSheet.absoluteFill}><View style={languageRowMaskStyles.englishTop}/><View style={languageRowMaskStyles.englishBottom}/><View style={languageRowMaskStyles.englishLeft}/><View style={languageRowMaskStyles.englishRight}/><View style={[languageRowMaskStyles.radioEnglish,language==='en'?languageRowMaskStyles.selectedRadio:languageRowMaskStyles.unselectedRadio]}>{language==='en'&&<View style={languageRowMaskStyles.radioDot}/>}</View><View style={[languageRowMaskStyles.radioHindi,language==='hi'?languageRowMaskStyles.selectedRadio:languageRowMaskStyles.unselectedRadio]}>{language==='hi'&&<View style={languageRowMaskStyles.radioDot}/>}</View><View style={[languageRowMaskStyles.radioMarathi,language==='mr'?languageRowMaskStyles.selectedRadio:languageRowMaskStyles.unselectedRadio]}>{language==='mr'&&<View style={languageRowMaskStyles.radioDot}/>}</View></View><Pressable style={languageSelectorStyles.languageBackHit} onPress={()=>navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back"/><Pressable style={languageSelectorStyles.languageEnglishHit} onPress={()=>void setLanguage('en')} accessibilityRole="radio" accessibilityState={{selected:language==='en'}} accessibilityLabel="English"/><Pressable style={languageSelectorStyles.languageHindiHit} onPress={()=>void setLanguage('hi')} accessibilityRole="radio" accessibilityState={{selected:language==='hi'}} accessibilityLabel="Hindi"/><Pressable style={languageSelectorStyles.languageMarathiHit} onPress={()=>void setLanguage('mr')} accessibilityRole="radio" accessibilityState={{selected:language==='mr'}} accessibilityLabel="Marathi"/><Pressable style={languageSelectorStyles.languageContinueHit} onPress={()=>void saveAndContinue()} accessibilityRole="button" accessibilityLabel="Save and Continue"/></View>
}

export function PhoneLoginScreen({navigation}:NativeStackScreenProps<AuthStackParamList,'PhoneLogin'>){return <PhoneAuthScreen navigation={navigation} mode="login"/>}
export function SignUpScreen({navigation}:NativeStackScreenProps<AuthStackParamList,'SignUp'>){return <PhoneAuthScreen navigation={navigation} mode="signup"/>}

function PhoneAuthScreen({navigation,mode}:{navigation:NavigationProp<AuthStackParamList>;mode:'login'|'signup'}){
 const {requestOtp,verifyOtp}=useAuth(); const [phone,setPhone]=useState(''); const [otp,setOtp]=useState(''); const [sent,setSent]=useState(false); const [seconds,setSeconds]=useState(0); const [message,setMessage]=useState<string|null>(null); const [busy,setBusy]=useState(false); const refs=useRef<Array<TextInput|null>>([]);
 useEffect(()=>{if(seconds<=0)return; const t=setInterval(()=>setSeconds(v=>v-1),1000); return()=>clearInterval(t)},[seconds]);
 const send=async()=>{setBusy(true);setMessage(null);try{const r=await requestOtp(phone);setPhone(r.phone.replace('+91',''));setSent(true);setOtp('');setSeconds(30);setTimeout(()=>refs.current[0]?.focus(),120)}catch(e){setMessage(e instanceof Error?e.message:'Unable to send OTP.')}finally{setBusy(false)}};
 const verify=async()=>{if(!/^\d{6}$/.test(otp)){setMessage('Enter the 6-digit OTP sent to your phone.');return}setBusy(true);setMessage(null);try{await verifyOtp(phone,otp)}catch(e){setMessage(e instanceof Error?e.message:'Unable to verify OTP.')}finally{setBusy(false)}};
 const updateDigit=(index:number,value:string)=>{const digits=value.replace(/\D/g,''); if(digits.length>1){const six=digits.slice(0,6);setOtp(six);refs.current[Math.min(5,six.length-1)]?.focus();return} const next=otp.padEnd(6,' ').split('');next[index]=digits||' ';setOtp(next.join('').trimEnd());if(digits&&index<5)refs.current[index+1]?.focus()};
 return <DesignImage source={loginImage}>
   <View style={styles.phoneOverlay} pointerEvents="box-none">
    <BackButton onPress={()=>navigation.goBack()}/>
    <TextInput value={phone} onChangeText={v=>setPhone(v.replace(/\D/g,'').slice(0,10))} keyboardType="phone-pad" style={styles.phoneInput} placeholder="" maxLength={10}/>
    <Pressable style={styles.sendHit} onPress={()=>void send()} disabled={busy}/>
    {sent && <>
      <View style={styles.otpOverlay}>{Array.from({length:6},(_,i)=><TextInput key={i} ref={r=>{refs.current[i]=r}} value={otp[i]||''} onChangeText={v=>updateDigit(i,v)} onKeyPress={({nativeEvent})=>{if(nativeEvent.key==='Backspace'&&!otp[i]&&i>0)refs.current[i-1]?.focus()}} keyboardType="number-pad" maxLength={1} style={styles.otpBox}/>)}</View>
      <Pressable style={styles.loginHit} onPress={()=>void verify()} disabled={busy}/>
      {seconds===0&&<Pressable style={styles.resendHit} onPress={()=>void send()} disabled={busy}/>} 
    </>}
    {message&&<View style={styles.message}><InlineMessage>{message}</InlineMessage></View>}
    <Pressable style={styles.signupHit} onPress={()=>navigation.navigate(mode==='login'?'SignUp':'PhoneLogin')}/>
   </View>
 </DesignImage>
}

export function RoleSelectionScreen(){
 const {availableRoles,selectRole}=useRole(); const {logout}=useAuth(); const [loading,setLoading]=useState(false);
 const choose=async(code:ApplicationRole)=>{const role=availableRoles.find(r=>r.code===code);if(!role){Alert.alert('Coming Soon','FPO Dashboard will be added in a future FarmPrism release.');return}setLoading(true);await selectRole(role.id);setLoading(false)};
 return <DesignImage source={roleImage}><BackButton onPress={()=>void logout()}/><View style={styles.roleHits}>{(['farmer','buyer','logistics'] as ApplicationRole[]).map((r,i)=><Pressable key={r} disabled={loading} onPress={()=>void choose(r)} style={[styles.roleHit, i===0?styles.r1:i===1?styles.r2:styles.r3]}/>) }<Pressable style={styles.fpoHit} onPress={()=>Alert.alert('FPO Dashboard','Coming Soon')}/></View></DesignImage>
}

export function RoleDashboardPlaceholder({role}:{role:ApplicationRole}){const {logout}=useAuth();return <ScreenLayout><BrandMark/><ScreenIntro title={`${role[0].toUpperCase()}${role.slice(1)} workspace`} description="Your role-specific FarmPrism experience will appear here."/><SecondaryButton label="Log out" onPress={()=>void logout()}/></ScreenLayout>}

const styles=StyleSheet.create({canvas:{flex:1,backgroundColor:'#f5f1e8'},background:{flex:1,width:'100%',height:'100%'},welcomeContinue:{position:'absolute',left:'14%',right:'14%',bottom:'2.5%',height:'7%'},welcomeSkip:{position:'absolute',right:'7%',top:'3%',width:'16%',height:'5%'},backButton:{position:'absolute',zIndex:3,top:54,left:22,width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.95)',borderWidth:1,borderColor:'#D6E0D5',shadowColor:'#1D4527',shadowOpacity:.14,shadowRadius:8,elevation:2},backButtonLabel:{fontSize:34,lineHeight:38,color:'#245B2A',fontWeight:'500',marginTop:-4},phoneOverlay:{...StyleSheet.absoluteFill},phoneInput:{position:'absolute',left:'20%',top:'42.0%',width:'58%',height:'4.7%',fontSize:16,color:'#24372A',paddingHorizontal:8,backgroundColor:'transparent'},sendHit:{position:'absolute',left:'20%',top:'47.1%',width:'60%',height:'5.1%'},otpOverlay:{position:'absolute',left:'20%',top:'59.8%',width:'60%',height:'5.2%',flexDirection:'row',justifyContent:'space-between'},otpBox:{width:'15.5%',height:'100%',textAlign:'center',fontSize:18,fontWeight:'700',color:'#24372A',backgroundColor:'transparent'},loginHit:{position:'absolute',left:'20%',top:'70.8%',width:'60%',height:'5.3%'},resendHit:{position:'absolute',left:'29%',top:'66.0%',width:'43%',height:'4%'},signupHit:{position:'absolute',left:'25%',right:'25%',bottom:'1.5%',height:'5%'},message:{position:'absolute',left:'20%',right:'20%',top:'77%',backgroundColor:'rgba(255,253,247,.95)',padding:8,borderRadius:8},roleHits:{...StyleSheet.absoluteFill},roleHit:{position:'absolute',width:'36%',height:'22%'},r1:{left:'13%',top:'32%'},r2:{left:'53%',top:'32%'},r3:{left:'53%',top:'58%'},fpoHit:{position:'absolute',left:'13%',top:'58%',width:'36%',height:'22%'},langOption:{height:58,borderWidth:1,borderColor:'#D6E0D5',borderRadius:10,backgroundColor:'#fff',flexDirection:'row',alignItems:'center',paddingHorizontal:16},langSelected:{borderColor:'#2F7A3E',borderWidth:2},radio:{height:20,width:20,borderRadius:10,borderWidth:2,borderColor:'#A7B7A9',marginRight:12},radioActive:{backgroundColor:'#2F7A3E',borderColor:'#2F7A3E'},langText:{fontSize:16,fontWeight:'600',color:'#24442D'}});
