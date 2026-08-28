import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import fr from './locales/fr.json'

/**
 * App-wide internationalization (react-i18next).
 *
 * - Translations live in ./locales/<lang>.json. Add a language by dropping in a
 *   new file, registering it in `resources` + `SUPPORTED_LANGUAGES`, and mapping
 *   its Ant Design locale in ../app/antdLocale.ts.
 * - The active language is detected from localStorage first (so a user's choice
 *   sticks), then the browser, falling back to English.
 * - Use it in components with `const { t } = useTranslation()` and `t('some.key')`.
 */

/** The languages offered in the header switcher. `label` is shown as-is (endonym). */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

export const LANGUAGE_STORAGE_KEY = 'elara.lang'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false }, // React already escapes
    // Resources are bundled inline (no async backend), so translations are ready
    // synchronously — disabling Suspense keeps components (and tests) simple.
    react: { useSuspense: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

export default i18n
