<template>
  <div><!-- Wrapping an empty div because of multiple roots with v-for-->
    <el-row>
      <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="19" :span="20">
        <el-row :align="'middle'">
          <h5 class="text-2xl font-medium dark:text-white">
            <router-link :to="getSearchDetailUrl(object)" class="text-blue-600 hover:text-blue-800 visited:text-purple-600 break-words">
              {{ object.name || object.id }}
            </router-link>
          </h5>
        </el-row>

        <el-row :align="'middle'">
          <p class="font-normal text-gray-700 dark:text-gray-400">
            Type:
          </p>
          <div class="flex flex-wrap">
            <span class="m-2" v-for="type of object.recordType">{{ type }}</span>
          </div>
        </el-row>

        <template v-for="special of searchDetails">
          <el-row v-if="object[special.field]">
            <p class="font-normal text-gray-700 dark:text-gray-400">
              {{ special.label }}:&nbsp;
            </p>
            <p>{{ object[special.field][special.name] }}</p>
          </el-row>
        </template>

        <el-row align="middle" v-if="object.memberOf" >
          <p class="font-normal text-gray-700 dark:text-gray-400">
            Member of:&nbsp;
          </p>
            <router-link
               class="text-sm m-2 text-gray-700 dark:text-gray-300 underline"
               :to="'/collection?id=' + encodeURIComponent(object.memberOf)">
              {{ object.memberOf }}
            </router-link>
        </el-row>

        <el-row align="middle" v-if="object.root && object.root !== object.memberOf" class="pt-2">
          <p class="font-normal text-gray-700 dark:text-gray-400">
            &nbsp;In:&nbsp;
          </p>
            <router-link
                :to="'/collection?id=' + encodeURIComponent(object.root)">
              <el-button>{{ object.root }}</el-button>
            </router-link>
        </el-row>

        <el-row align="middle">
          <p class="font-normal text-gray-700 dark:text-gray-400">
            {{ object.conformsTo }}
          </p>
        </el-row>

        <el-row class="py-4 pr-4" v-if="object.description">
          <p :id="'desc_'+_uuid">{{ object.description }}</p>
        </el-row>

        <el-row class="gap-2 flex">
          <span class="after:content-[','] last:after:content-none" v-if="object.metadata?.collections">Collections: {{ object.metadata.collections }}</span>
          <span class="after:content-[','] last:after:content-none" v-if="object.metadata?.objectsCount">Objects: {{ object.metadata.objectsCount }}</span>
          <span class="after:content-[','] last:after:content-none" v-if="object.metadata?.filesCount">Files: {{ object.metadata.filesCount }}</span>
        </el-row>

    <!--   <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="5" :span="4" :offset="0"> -->
    <!--     <template v-if="types.includes('RepositoryCollection') || types.includes('RepositoryObject')"> -->
    <!--       <el-row :span="24" class="flex justify-center" v-for="agg of aggConfig"> -->
    <!--         <template v-if="agg.icons"> -->
    <!--           <AggregationHelper :asIcons="true" -->
    <!--                              :aggregations="aggregations" -->
    <!--                              :field="{ 'name': agg.name, 'display': agg.display }" -->
    <!--                              :id="id"/> -->
    <!--         </template> -->
    <!--       </el-row> -->
    <!--     </template> -->
    <!--     <template v-else> -->
    <!--       <el-row :span="24" class="flex justify-center" v-for="agg of aggConfig"> -->
    <!--         <template v-if="agg.icons"> -->
    <!--           <template v-if="agg.name === 'license.@id'"><--This is needed because license comes from configuration-->
    <!--             <AggregationHelper :asIcons="true" -->
    <!--                                :item="findLicense(object.license)" -->
    <!--                                :field="{'display': 'Licence'}"/> -->
    <!--           </template> -->
    <!---->
    <!--           <template v-else> -->
    <!--             <AggregationHelper :asIcons="true" -->
    <!--                                :item="getValue(agg.name)" -->
    <!--                                :field="{ 'name': agg.name, 'display': agg.display }" -->
    <!--                                :id="id"/> -->
    <!--           </template> -->
    <!--         </template> -->
    <!--       </el-row> -->
    <!--     </template> -->
      </el-col>
    </el-row>
    <hr class="divide-y divide-gray-500"/>
  </div>
</template>
<script>
import { v4 as uuid } from 'uuid';
// import AggregationHelper from './helpers/AggregationHelper.component.vue';
import { initSnip, toggleSnip } from '../tools';

export default {
  // components: {
  //   AggregationHelper,
  // },
  props: ['object'],
  data() {
    return {
      _uuid: uuid(),
      aggConfig: this.$store.state.configuration.ui.aggregations,
      conformsToNotebook: this.$store.state.configuration.ui.conformsTo?.notebook,

      // TODO: Rename this
      searchDetails: this.$store.state.configuration.ui.search.searchDetails || [],
      // aggregations: this.$store.state.configuration.ui.aggregations,
    };
  },
  mounted() {
    if (!this.descriptionSnipped) {
      initSnip({ selector: `#desc_${this._uuid}`, lines: 3 });
    }
  },
  methods: {
    getSearchDetailUrl(item) {
      // TODO: this is not good, maybe do it with a ConformsTo to specify link.
      // But have to think about it because not all files have conformsTo!
      const { recordType } = item;
      const repoType = recordType.find((t) => t === 'RepositoryCollection');
      const fileType = recordType.find((t) => t === 'File');
      const itemType = recordType.find((t) => t === 'RepositoryObject');

      const id = encodeURIComponent(item.id);

      if (repoType) {
        return `/collection?id=${id}`;
      }

      if (itemType) {
        return `/object?id=${id}`;
      }

      // FIXME: Deal with files
      // if (fileType) {
      //   let isNotebook;
      //   if (item._source?.['conformsTo']) {
      //     isNotebook = item._source['conformsTo'].find(c => c['@id'] === this.conformsToNotebook);
      //   }
      //
      //   if (isNotebook) {
      //     id = encodeURIComponent(item._id);
      //     return `/object?_id=${id}`;
      //   } else {
      //     const fileId = id;
      //     id = encodeURIComponent(first(item._source['_parent'])?.['@id']);
      //     return `/object?id=${id}&_id=${id}&fileId=${fileId}`
      //   }
      // }

      // Defaults to object if it doesnt know what it is
      return `/object?id=${id}`;
    },
    doSnip(selector) {
      toggleSnip(selector);
      this.descriptionSnipped = true;
    },
  },
};
</script>
