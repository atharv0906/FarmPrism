import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
import { authService, toAuthServiceError } from '../../services/auth/auth.service';
import type { AuthServiceError } from '../../services/auth/auth.types';
import { AuthContext, type AuthContextValue } from '../../hooks/useAuth';
import { SplashScreen } from '../../screens/SplashScreen';
import { isDevelopmentMockOtpEnabled } from '../../services/auth/otp.strategy';

function createMockUser(phone:string):User{return{id:'development-mock-user',app_metadata:{},user_metadata:{},aud:'authenticated',created_at:new Date(0).toISOString(),email:undefined,phone,confirmed_at:new Date(0).toISOString(),last_sign_in_at:new Date().toISOString(),role:'authenticated',updated_at:new Date().toISOString(),identities:[],is_anonymous:false,factors:[]}}

export function AuthProvider({children}:PropsWithChildren){
 const[session,setSession]=useState<Session|null>(null);const[user,setUser]=useState<User|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState<AuthServiceError|null>(null);const[mockAuthenticated,setMockAuthenticated]=useState(false);const restoredRef=useRef(false);
 useEffect(()=>{let mounted=true;const mock=isDevelopmentMockOtpEnabled();const subscription=mock||!supabase?null:supabase.auth.onAuthStateChange((_event,next)=>{if(!mounted)return;setSession(next);setUser(next?.user??null);setError(null);if(restoredRef.current)setLoading(false)});if(mock){const timer=setTimeout(()=>{if(mounted){restoredRef.current=true;setLoading(false)}},1100);return()=>{mounted=false;clearTimeout(timer)}}void authService.restoreSession().then(restored=>{if(!mounted)return;setSession(restored.session);setUser(restored.user);setMockAuthenticated(false);setError(null)}).catch(e=>{if(!mounted)return;setSession(null);setUser(null);setMockAuthenticated(false);setError(toAuthServiceError(e))}).finally(()=>{if(mounted){restoredRef.current=true;setLoading(false)}});return()=>{mounted=false;subscription?.data.subscription.unsubscribe()}},[]);
 const value=useMemo<AuthContextValue>(()=>({loading,authenticated:Boolean((session&&user)||mockAuthenticated),user,session,authMode:mockAuthenticated?'development-mock':'supabase',error,requestOtp:async phone=>{const r=await authService.requestOtp(phone);setError(null);return r},verifyOtp:async(phone,token)=>{const r=await authService.verifyOtp(phone,token);setSession(r.session);setUser(r.isMockAuth?createMockUser(phone):r.user);setMockAuthenticated(r.isMockAuth);setError(null);return r},logout:async()=>{await authService.logout();setSession(null);setUser(null);setMockAuthenticated(false);setError(null)}}),[error,loading,mockAuthenticated,session,user]);
 if(loading)return <SplashScreen/>;return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
