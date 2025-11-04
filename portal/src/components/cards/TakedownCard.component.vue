<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5" v-if="this.takedownForm">
    <h5 class="text-2xl font-medium">Takedown Request
            <el-tooltip class="box-item" effect="light" trigger="hover" content="Make requests for the current item to be removed from the portal." placement="top">
              <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray"/>
            </el-tooltip>
            </h5>
    <hr class="divider divider-gray pt-2" />
    <h4 class="text-1xl font-medium">
      If an item on this page should not be made public, you can request that it be taken
      down:
      <span style="display: inline-flex; align-items: center;"><el-link underline="underline" :underline="true"
          type="primary" :href="takedownLink()" target="_blank" class="mx-1">
          Takedown Request Form
        </el-link></span>
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
