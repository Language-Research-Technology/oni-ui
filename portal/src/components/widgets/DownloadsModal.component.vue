<template>
  <el-dialog
      v-model="visible"
      title="Downloads for this collection"
      width="50%">
    <el-pagination class="items-center w-full"
                   background layout="prev, pager, next"
                   :total="objectTotals || 0"
                   v-model:page-size="pageSize"
                   v-model:currentPage="currentPage"
                   @current-change="updatePages($event)"
                   @update:page-size="pageSize"/>
    <div v-if="objectTotals > 0" v-loading="loading">
      <el-row class="hidden-sm-and-down py-2">
        <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
          <h3 class="font-bold">Details</h3>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
          <h3 class="font-bold">Link</h3>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
          <h3 class="font-bold">License</h3>
        </el-col>
      </el-row>
      <template v-for="(obj, index) of objects" :key="index">
        <ZipLink :id="obj.id" :name="obj.name" :licenses="obj.license"
                 :message="obj.message" :asTableRow="true"
                 v-if="obj.name"/>
      </template>
    </div>
    <template v-else>
      <p>No downloads associated with this item/collection.</p>
    </template>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeModal">Close</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script>
import { first } from 'lodash';
import ZipLink from '../ZipLink.component.vue';

export default {
  components: {
    ZipLink,
  },
  props: ['id', 'modelValue', 'title'],
  data() {
    return {
      isModalVisible: false,
      loading: false,
      metaPath: '',
      objects: [{}],
      scrollId: '',
      objectTotals: 0,
      objectsScrollId: '',
      pageSize: 10,
      currentPage: 1,
    };
  },
  computed: {
    visible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
  },
  watch: {
    visible: {
      handler(newValue, oldValue) {
        if (newValue) {
          this.getObjects();
        }
      },
    },
  },
  methods: {
    first,
    closeModal() {
      this.visible = false;
    },
    async updatePages(page) {
      this.currentPage = page;
      await this.getObjects();
    },
    async getObjects() {
      this.loading = true;
      const items = await this.$elasticService.multi({
        filters: { '_root.@id': [this.id], _isOCFL: 'true' },
        sort: 'relevance',
        order: 'desc',
        pageSize: this.pageSize,
        searchFrom: (this.currentPage - 1) * this.pageSize,
      });
      this.objectTotals = items?.hits?.total?.value;
      this.objectsScrollId = items?._scroll_id;
      const thisItems = items?.hits?.hits;
      if (thisItems) {
        this.objects = thisItems;
        const objs = [];
        for (const item of thisItems) {
          objs.push({
            id: item._source['@id'],
            name: first(item._source.name)?.['@value'],
            license: item._source.license,
          });
        }
        this.objects = objs;
      } else {
        this.objects = this.objects.concat(thisItems);
      }
      this.loading = false;
    },
  },
};
</script>
