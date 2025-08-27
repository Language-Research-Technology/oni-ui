<script setup lang="ts">
import { onUpdated, ref } from 'vue';

import { ui } from '@/configuration';
import { useSplashStore } from '@/stores/splash';

const props = defineProps({
  launch: Boolean,
});

const emit = defineEmits(['close']);

const { splash, shortTitle } = ui;
const splashStore = useSplashStore();

const centerDialogVisible = ref(splash.enabled && !splashStore.splashed);

const textStyles = splash.textClass || 'text-5xl text-[#F4EDE4] pb-10';
const backgroundImage = splash.image ? new URL(`/src/assets/${splash.image}`, import.meta.url).href : undefined;
const styles = backgroundImage ? `background-image: url(${backgroundImage});` : '';
const bgClasses = splash.image ? 'bg-repeat' : 'bg-sky-300';

const closeDialog = () => {
  splashStore.splashed = true;
  centerDialogVisible.value = false;
  emit('close');
};

onUpdated(() => {
  if (props.launch) {
    centerDialogVisible.value = true;
  }
});
</script>

<template>
  <el-dialog v-model="centerDialogVisible" width="70%" align-center @closed="closeDialog" :close-on-press-escape="false"
    :close-on-click-modal="false" :style="styles" :class="bgClasses">
    <el-row>
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" :span="4" :offset="0"></el-col>
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" :span="24" :offset="0">
        <p :class="textStyles">Welcome to {{ shortTitle || 'Oni' }}</p>
        <div :class="textStyles" v-html="splash.text || 'Configure Slash Screen in configuration.ui.splashText'">
        </div>
      </el-col>
    </el-row>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">Continue</el-button>
      </span>
    </template>
  </el-dialog>
</template>
