<template>
  <el-tooltip v-if="href" :content="alt" placement="bottom" effect="light">
    <el-link v-if="external" underline="always" :href="href" target="_blank">{{ text }}
      <!--: {{ bucket.doc_count }}--></el-link>
    <el-link v-else underline="always" :href="href">{{ text }}
      <!--: {{ bucket.doc_count }}--></el-link>
  </el-tooltip>
  <div v-else>
    {{ text }}
  </div>
</template>
<script>
import { first } from 'lodash';

export default {
  props: ['external', 'id', 'field', 'value', 'fieldName'],
  data() {
    return {
      href: '',
      text: '',
      alt: '',
    };
  },
  async mounted() {
    const route = `/search/fields/items?field=${this.field}&value=${this.value}`;
    console.log(route);
    const response = await this.$http.get({ route });
    const items = await response.json();
    const res = first(items.hits?.hits);
    const element = res?._source;
    const property = first(element?.[this.fieldName]);
    if (property) {
      this.href = property['@id'];
      this.text = first(property.name)?.['@value'];
      this.alt = first(property.description)?.['@value'];
    } else {
      this.text = this.value;
      this.href = false;
    }
  },
  watch: {},
};
</script>
