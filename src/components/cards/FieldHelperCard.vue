<script setup lang="ts">
import vocabs from '../../../vocab.json';

const { meta } = defineProps<{
  meta: { name: string; display?: string };
}>();

const type = `https://w3id.org/ldac/terms#${meta.name}` in vocabs ? 'w3id' : 'schema';
const url = type === 'w3id' ? `https://w3id.org/ldac/terms#${meta.name}` : `http://schema.org/${meta.name}`;
const id = type === 'w3id' ? `https://w3id.org/ldac/terms#${meta.name}` : `schema:${meta.name}`;
const definition = (vocabs as unknown as Record<string, string>)[id];
</script>

<template>
  <el-popover placement="right" trigger="click" :width="400"
    popper-style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 20px;"
    :persistent="false">
    <template #reference>
      <el-button size="small" link type="" class="text-xs">
        <font-awesome-icon icon="fa-solid fa-circle-question" />
      </el-button>
    </template>

    <template #default>
      <div :body-style="{ padding: '0px' }" class="grid">
        <h4 class="text-3xl font-normal leading-normal mt-0">{{ meta?.display || meta?.name }}</h4>
        <el-divider />
        <div>
          <p>{{ definition }}</p>
          <p>
            <el-link type="primary" :href="url" target="_blank" rel="nofollow noreferrer">
              {{ url }}
            </el-link>
          </p>
        </div>

      </div>
    </template>
  </el-popover>
</template>
