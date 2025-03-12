<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const { user } = storeToRefs(authStore);
</script>

<template>
  <div class="bg-gray-100 rounded-sm shadow-lg p-4 px-4 md:p-8 mb-6">
    <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
      <div class="text-gray-600">
        <p class="font-medium text-lg">User Details</p>
        <p></p>
      </div>

      <div v-if="user" class="lg:col-span-2">
        <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
          <div class="md:col-span-5">
            <label for="full_name">Full Name</label>
            <input type="text" name="full_name" id="full_name"
              class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50" v-model="user.name" />
          </div>

          <div v-if="user.email" class="md:col-span-5">
            <label for="email">Email Address</label>
            <input type="text" name="email" id="email" class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50"
              v-model="user.email" placeholder="email@domain.com" />
          </div>

          <div v-if="user.organization" class="md:col-span-3">
            <label for="address">Organisation</label>
            <input type="text" name="address" id="address" class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50"
              v-model="user.organization" placeholder="" />
          </div>

          <div v-if="user.provider" class="md:col-span-2">
            <label for="provider">Login Provider</label>
            <input type="text" name="provider" id="provider" class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50"
              v-model="user.provider" placeholder="Provider" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
