import type { I18n, I18nOptions } from 'vue-i18n';
import { createI18n } from 'vue-i18n';

import { ui } from '@/configuration';

const { urlPrefix = '' } = ui;

import deMessages from '@/i18n/locales/de.json';
import enMessages from '@/i18n/locales/en.json';
import esMessages from '@/i18n/locales/es.json';
import frMessages from '@/i18n/locales/fr.json';

type Locale = 'en' | 'de' | 'fr' | 'es';
type Messages = Record<string, Record<string, string>>;

const builtInMessages: Record<Locale, Messages> = {
  en: enMessages,
  de: deMessages,
  fr: frMessages,
  es: esMessages,
};

const localeMerge = (target: Messages, source: Messages): Messages => {
  const result = { ...target };

  for (const outer in source) {
    for (const inner in source[outer]) {
      const value = source[outer][inner];
      if (value) {
        result[outer] ||= {};
        result[outer][inner] = value;
      }
    }
  }

  return result;
};

const loadRuntimeLocale = async (locale: Locale): Promise<Messages | null> => {
  try {
    const response = await fetch(`${urlPrefix}/i18n/${locale}.json`);

    if (!response.ok) {
      return null;
    }

    const messages = (await response.json()) as Messages;

    return messages;
  } catch (_error) {
    return null;
  }
};

// Load and merge all locale messages (built-in + runtime)
const loadMessages = async (): Promise<Record<Locale, Messages>> => {
  const messages: Record<Locale, Messages> = { ...builtInMessages };
  const locales: Locale[] = ['en', 'de', 'fr', 'es'];

  // Load runtime locales and merge with built-in
  await Promise.all(
    locales.map(async (locale) => {
      const runtimeMessages = await loadRuntimeLocale(locale);

      if (runtimeMessages) {
        messages[locale] = localeMerge(messages[locale], runtimeMessages);
      }
    }),
  );

  return messages;
};

// Create and configure i18n instance
export const setupI18n = async (locale: Locale = 'en'): Promise<I18n> => {
  const messages = await loadMessages();

  const options: I18nOptions = {
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages,
  };

  const i18n = createI18n(options);

  return i18n;
};

export type { Locale };
