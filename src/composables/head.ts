import { useHead as useUnhead, type VueHeadClient } from '@unhead/vue';
import { ui } from '@/configuration';
import type { RoCrate } from '@/services/api';
import { first } from '@/tools';

export const useHead = (head: VueHeadClient, md: RoCrate) => {
  const {
    head: { title: titleField, meta: configMeta },
  } = ui;

  const title = String(first(md[titleField as keyof RoCrate] as string[]) || 'Research Object');

  const getValue = (fieldPath: string): string => {
    const value = md[fieldPath as keyof RoCrate];
    if (!Array.isArray(value)) {
      return String(value || '');
    }

    return value
      .map((item) => (typeof item === 'object' && 'name' in item ? first(item.name) : String(item)))
      .join(', ');
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
