<script setup lang="ts">
import { ref, watch } from 'vue';

const emit = defineEmits(['updateSearchInput', 'doSearch', 'setSearchParams']);

const { searchInput } = defineProps<{
  searchInput: string;
}>();

// You can't bind to a prop
const localInput = ref(searchInput);

const updateSearchInput = (text: string) => {
  localInput.value = text;
  emit('updateSearchInput', text);
};

watch(
  () => searchInput,
  (newValue) => {
    localInput.value = newValue;
  },
  { immediate: true },
);
</script>

<template>
  <el-row :offset="1" :gutter="0" align="bottom" class="flex flex-wrap content-around">
    <el-col :xs="24" class="h-auto">
      <el-row justify="center" :gutter="10" align="middle">
        <label for="searchInput" class="h-14 mx-2 w-full">
          <el-input v-model="localInput" @input="updateSearchInput" @keyup.enter="emit('doSearch')" type="text"
            class="px-2 h-full w-full" placeholder="Search..." name="searchInput" id="searchInput" ref="searchInput">

            <template #append>
              <button v-if="searchInput" @click="updateSearchInput('')"
                class="flex items-center justify-center pr-3 hover:text-red-600 mr-3 border-0 border-r-[1px] border-solid border-gray-300">
                <font-awesome-icon icon="fa-solid fa-xmark" />
              </button>

              <button @click="emit('doSearch')" class="flex items-center justify-center rounded-sm hover:text-red-600">
                <font-awesome-icon icon="fa-solid fa-magnifying-glass" size="2xl" />
              </button>
            </template>

          </el-input>
        </label>
      </el-row>

      <el-row justify="center" :gutter="20" align="middle" class="pt-2">
        <el-button @click="console.log(' MOO'); emit('setSearchParams', { advanceSearchEnabled: true })"
          class="cursor-pointer">
          Advanced Search&nbsp;
          <span class="text-xs text-gray-400 shadow-sm rounded-2xl px-2">beta</span>
        </el-button>
      </el-row>
    </el-col>
  </el-row>
</template>
