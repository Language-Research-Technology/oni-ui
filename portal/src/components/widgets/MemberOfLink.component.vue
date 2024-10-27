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
      const crateId = this.memberOf?.['@id'];
      this.link = `/collection?crateId=${encodeURIComponent(crateId)}`;
      this.value = this.memberOf?.name || undefined;
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
