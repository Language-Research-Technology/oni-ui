<template>
  <p>
    <el-link type="primary" :href="this.link">{{ this.field.name || this.field.id }}
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
    const id = this.field.id;
    this.link = `/${this.routePath}?id=${encodeURIComponent(id)}`;
  },
};
</script>
