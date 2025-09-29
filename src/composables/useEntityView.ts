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

  const isEmpty = (value: object | string | undefined): boolean => {
    if (value === null || value === undefined || value === '') {
      return true;
    }

    if (Array.isArray(value) && value.length === 0) {
      return true;
    }

    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return true;
    }

    return false;
  };

  const populateMeta = (md: RoCrate) => {
    meta.value = [];

    if (config.meta.mode === 'explicit') {
      // Explicit mode: only show specified fields in order
      for (const field of config.meta.show || []) {
        if (field in md) {
          const data = md[field as keyof RoCrate];
          if (!isEmpty(data)) {
            meta.value.push({ name: field, data });
          }
        }
      }

      // Log skipped fields
      for (const field of Object.keys(md) as (keyof RoCrate)[]) {
        if (!(config.meta.show || []).includes(field)) {
          console.debug(`Skipping field ${field} in explicit mode`); // eslint-disable-line no-console
        }
      }
    } else {
      // Add top fields first
      for (const field of config.meta.top) {
        if (field.name in md) {
          const data = md[field.name as keyof RoCrate];
          if (!isEmpty(data)) {
            meta.value.push({ name: field.name, data });
          }
        }
      }

      // Then add remaining fields, sorted alphabetically
      const keys = Object.keys(md) as (keyof RoCrate)[];
      const topFieldNames = config.meta.top.map((f) => f.name);
      const { hide } = config.meta;
      const filtered = keys.filter((key) => !hide.includes(key) && !topFieldNames.includes(key));
      filtered.sort();
      for (const filter of filtered) {
        const data = md[filter];
        if (!isEmpty(data)) {
          meta.value.push({ name: filter, data });
        }
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
