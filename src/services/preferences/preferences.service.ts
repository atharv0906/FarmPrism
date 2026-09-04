import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase/client';

export const DEFAULT_LANGUAGE_CODE = 'en' as const;
export const SUPPORTED_LANGUAGE_CODES = [DEFAULT_LANGUAGE_CODE] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

const LOCAL_LANGUAGE_KEY = '@farmprism/preferences/language-code';

type UserPreferenceLanguageRow = {
  language_code: string | null;
};

export class PreferencesServiceError extends Error {
  readonly operation: 'read' | 'write';
  readonly cause?: unknown;

  constructor(
    operation: 'read' | 'write',
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = 'PreferencesServiceError';
    this.operation = operation;
    this.cause = cause;
  }
}

export interface LanguagePreferenceResult {
  language: LanguageCode | null;
  error: PreferencesServiceError | null;
}

export interface LanguageSyncResult {
  language: LanguageCode;
  persisted: boolean;
  error: PreferencesServiceError | null;
}

export function isSupportedLanguageCode(value: string | null | undefined): value is LanguageCode {
  return Boolean(value && SUPPORTED_LANGUAGE_CODES.includes(value as LanguageCode));
}

async function readStoredLanguage(): Promise<LanguageCode | null> {
  try {
    const value = await AsyncStorage.getItem(LOCAL_LANGUAGE_KEY);
    return isSupportedLanguageCode(value) ? value : null;
  } catch {
    return null;
  }
}

async function storeLanguage(language: LanguageCode): Promise<PreferencesServiceError | null> {
  try {
    await AsyncStorage.setItem(LOCAL_LANGUAGE_KEY, language);
    return null;
  } catch (error) {
    return new PreferencesServiceError(
      'write',
      'The language preference could not be saved locally.',
      error,
    );
  }
}

async function readAuthenticatedLanguage(userId: string): Promise<LanguagePreferenceResult> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('language_code')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return {
        language: null,
        error: new PreferencesServiceError(
          'read',
          'The account language preference could not be loaded.',
          error,
        ),
      };
    }

    const preference = data as unknown as UserPreferenceLanguageRow | null;
    return {
      language: isSupportedLanguageCode(preference?.language_code)
        ? preference.language_code
        : null,
      error: null,
    };
  } catch (error) {
    return {
      language: null,
      error: new PreferencesServiceError(
        'read',
        'The account language preference could not be loaded.',
        error as PostgrestError,
      ),
    };
  }
}

async function persistAuthenticatedLanguage(
  userId: string,
  language: LanguageCode,
): Promise<PreferencesServiceError | null> {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          language_code: language,
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      return new PreferencesServiceError(
        'write',
        'The account language preference could not be saved.',
        error,
      );
    }

    return null;
  } catch (error) {
    return new PreferencesServiceError(
      'write',
      'The account language preference could not be saved.',
      error,
    );
  }
}

export const preferencesService = {
  async getLocalLanguage(): Promise<LanguageCode | null> {
    return readStoredLanguage();
  },

  async syncAuthenticatedLanguage(
    userId: string,
    localLanguage: LanguageCode | null,
  ): Promise<LanguageSyncResult> {
    const existing = await readAuthenticatedLanguage(userId);

    if (existing.error) {
      return {
        language: localLanguage ?? DEFAULT_LANGUAGE_CODE,
        persisted: false,
        error: existing.error,
      };
    }

    if (existing.language) {
      const localError = await storeLanguage(existing.language);
      return {
        language: existing.language,
        persisted: false,
        error: localError,
      };
    }

    const language = localLanguage ?? DEFAULT_LANGUAGE_CODE;
    const persistenceError = await persistAuthenticatedLanguage(userId, language);
    const localError = await storeLanguage(language);

    return {
      language,
      persisted: persistenceError === null,
      error: persistenceError ?? localError,
    };
  },

  async setLanguage(
    userId: string | null,
    language: LanguageCode,
  ): Promise<PreferencesServiceError | null> {
    const localError = await storeLanguage(language);

    if (!userId) {
      return localError;
    }

    const existing = await readAuthenticatedLanguage(userId);
    if (existing.error) {
      return existing.error;
    }

    if (existing.language === language) {
      return localError;
    }

    const persistenceError = await persistAuthenticatedLanguage(userId, language);
    return persistenceError ?? localError;
  },
};
