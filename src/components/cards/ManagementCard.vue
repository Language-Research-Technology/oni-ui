<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ui } from '@/configuration';
import type { EntityType } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const { entity } = defineProps<{
  entity: EntityType;
}>();

const { isLoggedIn } = storeToRefs(useAuthStore());
const {
  management: { editUrl },
} = ui;

const editLink = editUrl ? editUrl.replace('{id}', entity.id) : null;
</script>

<template>
  <el-card v-if="isLoggedIn" :body-style="{ padding: '0px' }" class="mx-10 p-5">
    <h5 class="text-2xl font-medium">
      Management
    </h5>
    <hr class="divider divider-gray pt-2" />
    <ul>
      <li class="font-semibold">
        <template v-if="editLink">
          <el-link type="primary" :href="editLink" target="_blank" rel="noopener">
            Edit
          </el-link>
        </template>
      </li>
    </ul>
  </el-card>
</template>
