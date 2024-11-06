<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5" v-if="this.takedownForm">
    <h5 class="text-2xl font-medium">Takedown Request</h5>
    <hr class="divider divider-gray pt-2" />
    <h4 class="text-1xl font-medium">
      If you see an item on this page that you think should not be made public, you can request that it be taken
      down:
      <el-link underline="underline" :underline="true" type="primary" :href="takedownLink()" target="_blank"
        class="mx-1">
        Takedown Request Form
      </el-link>
    </h4>
  </el-card>
</template>

<script>
export default {
  data() {
    return {
      takedownForm: this.$store.state.configuration.ui.googleForm?.takedown,
    };
  },
  methods: {
    takedownLink() {
      const currentUrl = encodeURIComponent(window.location.href);
      const form = this.takedownForm;
      return `${form}${currentUrl}`;
    },
  },
};
</script>
