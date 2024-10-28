<template>
  <el-dialog
      v-model="centerDialogVisible"
      width="70%"
      align-center
      @closed="closeDialog"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      :style="styles"
      class="bg-orange-200"
  >
    <el-row>
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" :span="4" :offset="0"></el-col>
      <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" :span="24" :offset="0">
        <p :class="textStyles">Welcome to {{
            this.$store.state.configuration.ui.shortTitle || 'Oni'
          }}</p>
        <div :class="textStyles" v-html="this.$store.state.configuration.ui.splashText || 'Configure Slash Screen in configuration.ui.splashText'"></div>
      </el-col>
    </el-row>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">Continue</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { getLocalStorage, loginSessionKey, putLocalStorage, removeLocalStorage, tokenSessionKey } from '@/storage';

export default {
  props: ['launch'],
  emits: ['close'],
  data() {
    let backgroundImage = '';
    if (this.$store.state.configuration.ui?.splashImage) {
      const image = this.getImage();
      backgroundImage = `url('${image}')`;
    }
    return {
      styles: {
        backgroundImage,
        'background-repeat': 'repeat',
        'background-color': 'rgb(117 190 218)',
      },
      textStyles: this.$store.state.configuration.ui.splashTextClass || 'text-5xl text-[#F4EDE4] pb-10',
      centerDialogVisible: false,
    };
  },
  created() {
    if (this.$store.state.configuration.ui.splashEnabled) {
      const splashed = getLocalStorage({ key: 'splashed' });
      if (!splashed) {
        this.centerDialogVisible = true;
      }
    }
  },
  updated() {
    if (this.launch) {
      this.centerDialogVisible = true;
    }
  },
  methods: {
    getImage() {
      try {
        const imageUri = require(`../assets/${this.$store.state.configuration.ui?.splashImage}`);
        return imageUri;
      } catch (e) {
        return '';
      }
    },
    closeDialog() {
      putLocalStorage({ key: 'splashed', data: true });
      this.centerDialogVisible = false;
      this.$emit('close');
    },
  },
};
</script>
