<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
    <h5 class="text-2xl font-medium ">Member Of</h5>
    <hr class="divider divider-gray pt-2"/>
    <template v-for="(f, index) of _memberOf" :key="index">
      <ul>
        <li class="font-semibold">
          <el-link
              :underline="true"
              type="primary"
              :href="`/${routePath}?id=${encodeURIComponent(f['@id'])}&_crateId=${encodeURIComponent(f['@id'])}`">
            {{ first(f.name)?.['@value'] || f['@id'] }}
          </el-link>
        </li>
      </ul>
    </template>
  </el-card>
</template>
<script>
import { first } from 'lodash';

export default {
  props: ['_memberOf', 'routePath'],
  data() {
    return {};
  },
  methods: {
    first,
  },
};
</script>
