import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAuth } from '../../hooks/useAuth';
import {
  DEFAULT_LANGUAGE_CODE,
  preferencesService,
  SUPPORTED_LANGUAGE_CODES,
  type LanguageCode,
  type PreferencesServiceError,
} from '../../services/preferences/preferences.service';
import { LanguageContext, type LanguageContextValue } from '../../hooks/useLanguage';

export function LanguageProvider({ children }: PropsWithChildren) {
  const { user, authMode } = useAuth();
  const preferenceUserId = authMode === 'development-mock' ? null : user?.id;
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE_CODE);
  const [loading, setLoading] = useState(true);
  const [hasSavedLanguage, setHasSavedLanguage] = useState(false);
  const [error, setError] = useState<PreferencesServiceError | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const localLanguage = await preferencesService.getLocalLanguage();
      if (mounted) setHasSavedLanguage(localLanguage !== null);
      const fallbackLanguage = localLanguage ?? DEFAULT_LANGUAGE_CODE;

      if (!preferenceUserId) {
        if (mounted) {
          setLanguageState(fallbackLanguage);
          setError(null);
          setLoading(false);
        }
        return;
      }

      const result = await preferencesService.syncAuthenticatedLanguage(preferenceUserId, localLanguage);
      if (!mounted) {
        return;
      }

      setLanguageState(result.language);
      setError(result.error);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [preferenceUserId]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      loading,
      hasSavedLanguage,
      error,
      supportedLanguages: SUPPORTED_LANGUAGE_CODES,
      setLanguage: async (nextLanguage) => {
        setLanguageState(nextLanguage);
        const persistenceError = await preferencesService.setLanguage(preferenceUserId ?? null, nextLanguage);
        setError(persistenceError);
      },
    }),
    [error, language, loading, hasSavedLanguage, preferenceUserId],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
