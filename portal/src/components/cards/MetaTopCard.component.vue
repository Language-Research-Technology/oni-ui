<template>
  <el-row v-for="field of tops" :class="className">
    <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7">
      <p class="font-bold">
        {{ field.name }}
      </p>
    </el-col>
    <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
      <p>{{ field.value }}</p>
    </el-col>
  </el-row>
</template>
<script>
import { first } from 'lodash';
export default {
  props: ['tops', 'className'],
  methods: { first },
};
</script>
