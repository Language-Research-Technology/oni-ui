<script setup lang="ts">
import { useConfigurationStore } from '@/stores/configuration';

const { ui } = useConfigurationStore();

const {
  shortTitle = 'Oni',
  enrollment,
} = ui;
</script>

<template>
  <p class="text-center break-normal">
    Follow the next link to enroll to {{ shortTitle }}
    <br />
    <el-link :underline="true" :href="enrollment.URL">{{ enrollment.URL }}</el-link>
  </p>
</template>
