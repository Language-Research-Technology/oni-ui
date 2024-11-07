<template>
  <ul>
    <li class="font-semibold">
      <el-link
          :underline="true"
          type="primary"
          :href="`/api/object/meta?resolve-parts&noUrid&id=${encodeURIComponent(id)}`" download="ro-crate-metadata.json">
        Download metadata
      </el-link>
    </li>
    <li class="font-semibold">
      <el-link
          :underline="true"
          type="primary"
          :href="`/api/object/meta?resolve-parts&noUrid&id=${encodeURIComponent(id)}`" target="_blank" rel="noreferrer noopener">
        Open metadata in a new window
      </el-link>
    </li>
  </ul>
</template>
<script>
import { first } from 'lodash';

export default {
  props: ['id'],
  data() {
    return {
      metaPath: '',
      notebooks: [],
    };
  },
  methods: {
    first,
  },
};
</script>
