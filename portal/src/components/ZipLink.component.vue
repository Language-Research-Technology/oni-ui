<template>
  <template v-if="asTableRow && zip.url">
    <el-row>
      <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
        <p v-if="zip?.numberOfFiles && zip?.expandedSize">
          Files: {{ zip.numberOfFiles }}, Size: {{ zip.expandedSize }}
        </p>
      </el-col>
      <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
        <el-link ref="linkElement"
                 :underline="true"
                 type="primary"
                 :href="zip.url"
                 :download="zip.name">
          {{ zip.name }}
          <el-tooltip v-if="message" class="box-item" effect="light" trigger="hover" :content="message"
                      placement="top">
            <el-button size="small" link>
              <font-awesome-icon icon="fa-solid fa-circle-info"/>
            </el-button>
          </el-tooltip>
        </el-link>
      </el-col>
      <el-col :xs="24" :sm="8" :md="8" :lg="8" :xl="8">
        <p v-for="license of licenses">
          <span class="justify-self-center">
            <a class="underline" :href="license['@id']">
            {{ first(license.name)?.['@value'] }}</a>
          </span>
        </p>
      </el-col>
    </el-row>
  </template>
  <template v-if="!asTableRow && zip.url">
    <el-row>
      <el-col>
        <p v-if="zip?.numberOfFiles && zip?.expandedSize">
          Files: {{ zip.numberOfFiles }}, Size: {{ zip.expandedSize }}
        </p>
        <el-link
            :underline="true"
            type="primary"
            :href="zip.url"
            :download="zip.name">
          {{ zip.name }}
        </el-link>
        <el-tooltip v-if="message" class="box-item" effect="light" trigger="hover" :content="message"
                    placement="top">
          <el-button size="small" link>
            <font-awesome-icon icon="fa-solid fa-circle-info"/>
          </el-button>
        </el-tooltip>
      </el-col>
    </el-row>
  </template>
</template>
<script>
import {first} from "lodash";
import convertSize from "convert-size";

export default {
  props: ['id', 'name', 'message', 'licenses', 'asTableRow'],
  data() {
    return {
      zip: {
        url: undefined,
        name: undefined,
        expandedSize: '',
        numberOfFiles: 0
      }
    }
  },
  watch: {
    'name': {
      async handler(newValue, oldValue) {
        let fileName;
        if (newValue) {
          fileName = newValue;
        } else {
          fileName = this.obj.id;
        }
        this.zip.name = fileName + '.zip';
      },
      deep: true,
      immediate: true
    },
    'id': {
      async handler(newValue, oldValue) {
        if (newValue) {
          const zip = await this.$zip.get(this.id);
          this.zip.url = zip.url;
          this.zip.numberOfFiles = zip.numberOfFiles;
          this.zip.expandedSize = zip.expandedSize;
        }
      },
      deep: true,
      immediate: true
    }
  },
  async updated() {
    let zipFileName = '';
    if (this.name) {
      zipFileName = this.name;
    } else {
      zipFileName = this.id;
    }
    this.zip.name = zipFileName + '.zip';
    if (this.id) {
      const zip = await this.$zip.get(this.id);
      this.zip.url = zip.url;
      this.zip.numberOfFiles = zip.numberOfFiles;
      this.zip.expandedSize = zip.expandedSize;
    }
  },
  mounted() {
    let zipFileName = '';
    if (this.name) {
      zipFileName = this.name;
    } else {
      zipFileName = this.id;
    }
    this.zip.name = zipFileName + '.zip';
  },
  methods: {
    first
  }
}
</script>
