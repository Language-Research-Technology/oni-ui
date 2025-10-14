<script setup lang="ts">
const { communicationMode } = defineProps<{ communicationMode?: string }>();

let iconName: string;
let useMankuIcon = false;

switch (communicationMode) {
  case 'SpokenLanguage':
  case 'WrittenLanguage':
    useMankuIcon = true;
    iconName = communicationMode;
    break;
  case 'SignedLanguage':
    iconName = 'fa-hands-asl-interpreting';
    break;
  case 'Gesture':
    iconName = 'fa-hand';
    break;
  case 'Song':
    iconName = 'fa-music';
    break;
  case 'WhistledLanguage':
    iconName = 'fa-face-kiss';
    break;
}
</script>

<template>
  <span v-if="communicationMode" class="p-1 m-1">
    <span class="justify-center">
      <el-tooltip class="box-item" effect="light" :content="`CommunicationMode: ${communicationMode}`"
        placement="bottom">
        <manku-icon v-if="useMankuIcon" :name="iconName" size="40" fill="grey" />
        <font-awesome-icon v-else :icon="['fa-solid', iconName]" size="2x" style="color: rgba(0,0,0,0.55);" />
      </el-tooltip>
    </span>
  </span>
</template>
