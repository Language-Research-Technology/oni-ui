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
          <p :id="'desc_'+uuid">{{ object.description }}</p>
        </el-row>

        <el-row class="gap-2 flex">
          <span class="after:content-[','] last:after:content-none" v-if="object.extra?.collections">Collections: {{ object.extra.collections }}</span>
          <span class="after:content-[','] last:after:content-none" v-if="object.extra?.objectsCount">Objects: {{ object.extra.objectsCount }}</span>
          <span class="after:content-[','] last:after:content-none" v-if="object.extra?.filesCount">Files: {{ object.extra.filesCount }}</span>
        </el-row>
      </el-col>

      <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="5" :span="4" :offset="0">
        <AccessControlIcon :accessControl="object.extra.accessControl"/>
        <CommunicationModeIcon :accessControl="object.extra.communicationMode"/>
        <el-row :span="24" class="flex justify-center">
          <template v-for="mediaType of object.extra.mediaType">
            <MediaTypeIcon :mediaType="mediaType"/>
          </template>
        </el-row>
      </el-col>
    </el-row>
    <hr class="divide-y divide-gray-500"/>
  </div>
</template>
<script>
import { v4 as v4uuid } from 'uuid';
import AccessControlIcon from './widgets/AccessControlIcon.component.vue';
import CommunicationModeIcon from './widgets/CommunicationModeIcon.component.vue';
import MediaTypeIcon from './widgets/MediaTypeIcon.component.vue';
import { initSnip, toggleSnip } from '../tools';

export default {
  components: {
    AccessControlIcon,
    CommunicationModeIcon,
    MediaTypeIcon,
  },
  props: ['object'],
  data() {
    return {
      uuid: v4uuid(),
      aggConfig: this.$store.state.configuration.ui.aggregations,
      conformsToNotebook: this.$store.state.configuration.ui.conformsTo?.notebook,

      // TODO: Rename this
      searchDetails: this.$store.state.configuration.ui.search.searchDetails || [],
      // aggregations: this.$store.state.configuration.ui.aggregations,
    };
  },
  mounted() {
    if (!this.descriptionSnipped) {
      initSnip({ selector: `#desc_${this.uuid}`, lines: 3 });
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
