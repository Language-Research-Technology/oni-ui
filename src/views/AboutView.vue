<script setup lang="ts">
import { useConfigurationStore } from '@/stores/configuration';

const { ui } = useConfigurationStore();

const { help } = ui;
</script>

<template>
  <div class="min-w-full pb-4 pt-0 px-2 pl-4">
    <div class="bg-white z-10">
    </div>
    <el-row :gutter="40" :offset="1" class="flex flex-row h-[calc(100vh-220px)] overflow-auto">
      <p class="text-gray-500 mb-3"></p>
      <div class="p-4 px-24 ms:p-8 mb-6">
        <div class="text-sm grid-cols-1 lg:grid-cols-3">
          <div class="text-gray-600">
            <div class="p-2">
              <p class="font-medium text-2xl">About</p>
            </div>
            <div class="p-2">
              <p class="font-medium text-lg" v-html="help.aboutText"></p>
            </div>
            <div class="p-2">
              <p class="font-medium text-lg" v-html="help.citationText"></p>
            </div>
          </div>
        </div>
      </div>
    </el-row>
  </div>
</template>
