<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { EntityType } from '@/services/api';

const { t } = useI18n();
const { entity, routePath } = defineProps<{
  entity: EntityType;
  routePath: string;
}>();

const link = `/${routePath}?id=${encodeURIComponent(entity.memberOf?.id || '')}`;
const rootLink = `/collection?id=${encodeURIComponent(entity.rootCollection.id)}`;
</script>

<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
    <h5 class="text-2xl font-medium">{{ t('memberOf.title') }}
      <el-tooltip class="box-item" effect="light" trigger="hover" :content="t('memberOf.tooltip')" placement="top">
        <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray" />
      </el-tooltip>
    </h5>
    <hr class="divider divider-gray pt-2" />
    <ul>
      <li class="font-semibold">
        <template v-if="entity.memberOf?.id !== entity.rootCollection.id">
          <el-link underline="always" type="primary" :href="rootLink">
            {{ entity.rootCollection.name || entity.rootCollection.id }}
          </el-link>
          <span>&nbsp;:&nbsp;</span>
        </template>

        <el-link underline="always" type="primary" :href="link">
          {{ entity.memberOf?.name || entity.memberOf?.id }}
        </el-link>
      </li>
    </ul>
  </el-card>
</template>
