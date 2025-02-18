<script setup lang="ts">
import { onUpdated, ref } from 'vue';

import { useConfigurationStore } from '@/stores/configuration';
import { useSplashStore } from '@/stores/splash';

const props = defineProps({
  launch: Boolean,
});

const emit = defineEmits(['close']);

const { ui } = useConfigurationStore();
const splash = useSplashStore();

const centerDialogVisible = ref(ui.splashEnabled && !splash.splashed);

const textStyles = ui.splashTextClass || 'text-5xl text-[#F4EDE4] pb-10';
const backgroundImage = ui.splashImage ? new URL(`/src/assets/${ui.splashImage}`, import.meta.url).href : undefined;
const styles = backgroundImage ? `background-image: url(${backgroundImage});` : '';
const bgClasses = ui.splashImage ? 'bg-repeat' : 'bg-sky-300';

const closeDialog = () => {
  splash.splashed = true;
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
        <p :class="textStyles">Welcome to {{ ui.shortTitle || 'Oni' }}</p>
        <div :class="textStyles" v-html="ui.splashText || 'Configure Slash Screen in configuration.ui.splashText'">
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
