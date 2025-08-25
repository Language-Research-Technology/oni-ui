import { useHead as useUnhead, type VueHeadClient } from '@unhead/vue';
import { ui } from '@/configuration';
import type { RoCrate } from '@/services/api';

export const useHead = (head: VueHeadClient, md: RoCrate) => {
  const {
    head: { title: titleField, meta: configMeta },
  } = ui;

  const title = String(md[titleField as keyof RoCrate] || 'Research Object');

  const getValue = (fieldPath: string): string => {
    const value = md[fieldPath as keyof RoCrate];
    if (Array.isArray(value)) {
      return value.map((item) => (typeof item === 'object' && item.name ? item.name : String(item))).join(', ');
    }

    if (typeof value === 'object' && value?.name) {
      return value.name;
    }

    return String(value || '');
  };

  // Build meta tags from configuration
  const metaTags = configMeta
    .map((metaConfig) => {
      const content = getValue(metaConfig.content);
      return content ? { name: metaConfig.name, content } : undefined;
    })
    .filter(Boolean);

  return useUnhead(
    {
      title,
      meta: metaTags,
    },
    { head },
  );
};
