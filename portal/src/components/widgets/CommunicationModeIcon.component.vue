<template>
  <span v-if="communicationMode" class="p-1 m-1">
    <span class="justify-center">
      <el-tooltip class="box-item" effect="dark" :content="`CommunicationMode: ${communicationMode}`" placement="bottom">
        <manku-icon v-if="special" :name="iconName" size="40" fill="grey"/>
        <font-awesome-icon v-else :icon="['fa-solid', iconName]" size="2x" style="color: rgba(0,0,0,0.55);"/>
      </el-tooltip>
    </span>
  </span>
</template>
<script>
export default {
  props: ['communicationMode'],
  data() {
    return {
      iconName: undefined,
      special: false,
    };
  },
  created() {
    switch (this.communicationMode) {
      case 'SpokenLanguage':
      case 'WrittenLanguage':
        this.useMankuIcon = true;
        this.iconName = this.communicationMode;
        break;
      case 'SignedLanguage':
        this.iconName = 'fa-hands-asl-interpreting';
        break;
      case 'Gesture':
        this.iconName = 'fa-hand';
        break;
      case 'Song':
        this.iconName = 'fa-music';
        break;
      case 'WhistledLanguage':
        this.iconName = 'fa-face-kiss';
        break;
    }
  },
};
</script>
