<template>
  <div class="whitespace-pre-wrap bg-slate-50">{{ this.content }}</div>
</template>
<script>
import { isEmpty } from 'lodash';
import 'element-plus/theme-chalk/display.css';

export default {
  props: ['data', 'limitText'],
  data() {
    return {
      content: '',
      loading: false,
    };
  },
  watch: {
    data: {
      handler() {
        if (this.limitText) {
          this.content = this.data?.slice(0, this.limitText);
        } else {
          this.content = this.data;
        }
      },
      flush: 'post',
      immediate: true,
    },
  },
};
</script>
