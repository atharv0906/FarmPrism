import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { roleService, RoleServiceError } from '../../services/roles/role.service';
import { isDevelopmentMockOtpEnabled } from '../../services/auth/otp.strategy';
import { RoleContext, type RoleContextValue } from '../../hooks/useRole';
import type { AvailableRole } from '../../types/role';

const MOCK_LAST_ROLE_KEY='farmprism.mock.lastRole';
const MOCK_ROLES:AvailableRole[]=[
 {id:'mock-farmer',code:'farmer'},
 {id:'mock-buyer',code:'buyer'},
 {id:'mock-logistics',code:'logistics'},
];

export function RoleProvider({children}:PropsWithChildren){
 const{user}=useAuth();const[availableRoles,setAvailableRoles]=useState<AvailableRole[]>([]);const[selectedRole,setSelectedRole]=useState<AvailableRole|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState<RoleServiceError|null>(null);const requestId=useRef(0);
 const reloadRoles=useCallback(async()=>{const id=++requestId.current;if(!user){setAvailableRoles([]);setSelectedRole(null);setError(null);setLoading(false);return}setLoading(true);try{if(isDevelopmentMockOtpEnabled()){const stored=await AsyncStorage.getItem(MOCK_LAST_ROLE_KEY);if(id!==requestId.current)return;setAvailableRoles(MOCK_ROLES);setSelectedRole(MOCK_ROLES.find(r=>r.id===stored)||null);setError(null);return}const state=await roleService.loadRoleState(user.id);if(id!==requestId.current)return;setAvailableRoles(state.availableRoles);setSelectedRole(state.selectedRole);setError(null)}catch(e){if(id!==requestId.current)return;setAvailableRoles([]);setSelectedRole(null);setError(e instanceof RoleServiceError?e:new RoleServiceError('unknown_error','The application roles could not be loaded.',e))}finally{if(id===requestId.current)setLoading(false)}},[user?.id]);
 useEffect(()=>{void reloadRoles()},[reloadRoles]);
 const value=useMemo<RoleContextValue>(()=>({loading,availableRoles,selectedRole,error,selectRole:async(roleId)=>{if(!user)return;const assigned=availableRoles.find(r=>r.id===roleId);if(!assigned){setError(new RoleServiceError('not_assigned','The selected role is not assigned to this user.'));return}try{if(isDevelopmentMockOtpEnabled()){await AsyncStorage.setItem(MOCK_LAST_ROLE_KEY,assigned.id);setSelectedRole(assigned);setError(null);return}const role=await roleService.selectRole(user.id,roleId);setSelectedRole(role);setError(null)}catch(e){setError(e instanceof RoleServiceError?e:new RoleServiceError('unknown_error','The application role could not be selected.',e))}},reloadRoles}),[availableRoles,error,loading,reloadRoles,selectedRole,user]);
 return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}
