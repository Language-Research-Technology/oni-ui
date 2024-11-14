<template>
  <p class="text-center break-normal">
    Follow the next link to enroll to {{this.siteTitle}}
    <br/>
    <el-link :underline="true" :href="enrollmentUrl">{{ enrollmentUrl }}</el-link>
  </p>
</template>
<script>
export default {
  props: [],
  data() {
    return {
      siteTitle: this.$store.state.configuration.ui?.shortTitle || 'Oni',
      enrollmentUrl: this.$store.state.configuration.ui?.enrollment?.URL || '',
    };
  },
  mounted() {},
  methods: {},
};
</script>
