import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ui } from '@/configuration';

type Locale = 'en' | 'de' | 'fr' | 'es';

export const useI18nStore = defineStore(
  'i18n',
  () => {
    const currentLocale = ref<Locale>('en');
    const availableLocales = computed<Locale[]>(() => {
      return ui.i18n?.availableLocales ?? ['en'];
    });

    const defaultLocale = computed<Locale>(() => {
      return ui.i18n?.defaultLocale ?? 'en';
    });

    const setLocale = (locale: Locale) => {
      if (availableLocales.value.includes(locale)) {
        currentLocale.value = locale;
      }
    };

    const detectBrowserLocale = (): Locale => {
      const browserLang = navigator.language.split('-')[0] as Locale;
      const supportedLocale = availableLocales.value.includes(browserLang) ? browserLang : defaultLocale.value;

      return supportedLocale;
    };

    const initializeLocale = () => {
      // Check if locale is already persisted
      if (!currentLocale.value || currentLocale.value === 'en') {
        // No persisted locale, detect browser language
        const detectedLocale = detectBrowserLocale();
        setLocale(detectedLocale);
      }
    };

    return {
      initializeLocale,
      currentLocale,
      availableLocales,
      defaultLocale,
      setLocale,
    };
  },
  {
    persist: true,
  },
);
