<template>
  <span v-if="value">
    <router-link class="break-words no-underline text-blue-600" :to="link">{{ value }}</router-link> >
  </span>
</template>
<script>
export default {
  props: ['memberOf'],
  updated() {
    this.setLink();
  },
  mounted() {
    this.setLink();
  },
  methods: {
    setLink() {
      const id = this.memberOf?.['@id'];
      this.link = `/collection?id=${encodeURIComponent(id)}`;
      // TODO: Should rocrates add a name to memberOf? Eslastic search had this
      this.value = this.memberOf?.name || id;
    },
  },
  data() {
    return {
      value: '',
      link: '',
    };
  },
};
</script>
