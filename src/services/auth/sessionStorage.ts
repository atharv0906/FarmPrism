import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type SessionStorage = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export const sessionStorage: SessionStorage = Platform.OS === 'web'
  ? {
      getItemAsync: AsyncStorage.getItem,
      setItemAsync: AsyncStorage.setItem,
      deleteItemAsync: AsyncStorage.removeItem,
    }
  : {
      getItemAsync: SecureStore.getItemAsync,
      setItemAsync: SecureStore.setItemAsync,
      deleteItemAsync: SecureStore.deleteItemAsync,
    };