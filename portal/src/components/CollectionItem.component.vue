<template>
  <p>
    <el-link type="primary" :href="this.link">{{ this.field.record.name || this.field.crateId }}
    </el-link>
  </p>
</template>
<script>
export default {
  props: ['field', 'routePath'],
  data() {
    return {
      link: '',
    };
  },
  mounted() {
    const crateId = this.field.crateId;
    this.link = `/${this.routePath}?crateId=${encodeURIComponent(crateId)}`;
  },
};
</script>
