import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { CollectionConfig, ObjectConfig } from '@/configuration';
import type { RoCrate } from '@/services/api';

export function useEntityView(config: CollectionConfig | ObjectConfig) {
  const router = useRouter();
  const route = useRoute();

  const name = ref<string>('');
  const meta = ref<{ name: string; data: RoCrate[keyof RoCrate] }[]>([]);

  const populateName = (md: RoCrate) => {
    const nameValue = md.name as string;
    name.value = Array.isArray(nameValue) ? nameValue[0] : nameValue;
  };

  const populateMeta = (md: RoCrate) => {
    meta.value = [];

    if (config.meta.mode === 'explicit') {
      // Explicit mode: only show specified fields in order
      for (const field of config.meta.show || []) {
        if (field in md) {
          meta.value.push({ name: field, data: md[field as keyof RoCrate] });
        }
      }
    } else {
      // Add top fields first
      for (const field of config.meta.top) {
        if (field.name in md) {
          meta.value.push({ name: field.name, data: md[field.name as keyof RoCrate] });
        }
      }

      // Then add remaining fields, sorted alphabetically
      const keys = Object.keys(md) as (keyof RoCrate)[];
      const topFieldNames = config.meta.top.map((f) => f.name);
      const filtered = keys.filter((key) => !config.meta.hide.includes(key) && !topFieldNames.includes(key));
      filtered.sort();
      for (const filter of filtered) {
        meta.value.push({ name: filter, data: md[filter] });
      }
    }
  };

  const handleMissingEntity = () => {
    router.push({
      name: 'NotFound',
      params: { pathMatch: route.path.substring(1).split('/') },
      query: route.query,
      hash: route.hash,
    });
  };

  return {
    name,
    meta,
    populateName,
    populateMeta,
    handleMissingEntity,
  };
}
