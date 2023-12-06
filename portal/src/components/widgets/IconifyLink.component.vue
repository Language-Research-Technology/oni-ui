<template>
  <a v-if="iconStyle" target="_blank" rel="nofollow noreferrer">
    <manku-icon :name="iconStyle" size="40" fill=""/>
  </a>
  <a v-else :href="id"
     class="break-words underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
     target="_blank" rel="nofollow noreferrer">{{ name || id }}</a>
</template>

<script>
export default {
  props: ['type', 'name', 'id'],
  data() {
    return {
      iconStyle: null
    }
  },
  mounted() {
    if (this.type) {
      switch (this.type) {
        case 'binderLink':
          this.iconStyle = this.type;
          break;
        case 'conformsTo':
          this.iconStyle = this.type;
          break;
        default:
          this.iconStyle = null;
      }
    }
  }
}
</script>
