import { createContext, useContext } from 'react';

import type {
  LanguageCode,
  PreferencesServiceError,
} from '../services/preferences/preferences.service';

export interface LanguageContextValue {
  language: LanguageCode;
  loading: boolean;
  error: PreferencesServiceError | null;
  supportedLanguages: readonly LanguageCode[];
  setLanguage: (language: LanguageCode) => Promise<void>;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider.');
  }

  return context;
}
