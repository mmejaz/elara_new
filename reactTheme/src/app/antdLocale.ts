import enUS from 'antd/locale/en_US'
import frFR from 'antd/locale/fr_FR'
import type { Locale } from 'antd/es/locale'

/**
 * Maps an app language code (see src/i18n) to the matching Ant Design locale, so
 * built-in component text (pagination, date pickers, empty states, table sorters)
 * translates alongside our own strings. Add a case when adding a language.
 */
const ANTD_LOCALES: Record<string, Locale> = {
  en: enUS,
  fr: frFR,
}

export function antdLocaleFor(lang: string): Locale {
  // 'en-US' → 'en'
  return ANTD_LOCALES[lang.split('-')[0]] ?? enUS
}
