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
  const { user } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE_CODE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PreferencesServiceError | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const localLanguage = await preferencesService.getLocalLanguage();
      const fallbackLanguage = localLanguage ?? DEFAULT_LANGUAGE_CODE;

      if (!user) {
        if (mounted) {
          setLanguageState(fallbackLanguage);
          setError(null);
          setLoading(false);
        }
        return;
      }

      const result = await preferencesService.syncAuthenticatedLanguage(user.id, localLanguage);
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
  }, [user?.id]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      loading,
      error,
      supportedLanguages: SUPPORTED_LANGUAGE_CODES,
      setLanguage: async (nextLanguage) => {
        setLanguageState(nextLanguage);
        const persistenceError = await preferencesService.setLanguage(user?.id ?? null, nextLanguage);
        setError(persistenceError);
      },
    }),
    [error, language, loading, user?.id],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
