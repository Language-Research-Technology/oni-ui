<template>
  <el-popover placement="right"
              trigger="click"
              :width="400"
              popper-style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 20px;"
              @show="searchMetaField"
              :persistent="false">
    <template #reference>
      <el-button size="small" link type="" class="text-xs">
        <font-awesome-icon icon="fa-solid fa-circle-question"/>
      </el-button>
    </template>
    <template #default>
      <div :body-style="{ padding: '0px' }" class="grid">
        <h4 class="text-3xl font-normal leading-normal mt-0">{{ meta?.display || meta?.id }}</h4>
        <el-divider/>
        <div v-loading="loading">
          <p>{{ definition }}</p>
          <p>
            <el-link type="primary" :href="this.url" target="_blank" rel="nofollow noreferrer">{{
                this.url
              }}
            </el-link>
          </p>
        </div>

      </div>
    </template>
  </el-popover>
</template>
<script>
import { first } from 'lodash';

export default {
  props: ['meta'],
  data() {
    return {
      loading: false,
      definition: '',
      url: '',
      baseVocab: this.$store.state.configuration.ui?.baseVocab || '',
    };
  },
  mounted() {},
  methods: {
    async searchMetaField() {
      this.loading = true;
      let id;
      if (this.meta.id) {
        id = `${this.baseVocab}${this.meta.id}`;
        const content = await this.$elasticService.single({ index: 'vocabs', _id: id });
        if (content?._source) {
          const source = content._source;
          this.definition = source?.['rdfs:comment'];
          this.url = id;
        } else {
          id = `schema:${this.meta.id}`;
          const content = await this.$elasticService.single({ index: 'vocabs', _id: id });
          if (content?._source) {
            const source = content._source;
            this.definition = source?.['rdfs:comment'];
            this.url = `http://schema.org/${this.meta.id}`;
          }
        }
      }
      this.loading = false;
    },
  },
};
</script>
