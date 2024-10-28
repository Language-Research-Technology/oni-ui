<template>
  <span v-if="value">
    <a class="break-words no-underline text-blue-600" :href="link">{{ value }}</a> >
  </span>
</template>
<script>
import { first } from 'lodash';

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
      const memberOf = first(this.memberOf);
      const id = memberOf?.['@id'];
      const _crateId = memberOf?.['@id'];
      this.link = `/collection?id=${encodeURIComponent(id)}&_crateId=${encodeURIComponent(_crateId)}`;
      this.value = first(memberOf?.name)?.['@value'] || undefined;
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
