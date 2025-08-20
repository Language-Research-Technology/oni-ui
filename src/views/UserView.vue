<script setup lang="ts">
import UserDetails from '@/components/UserDetails.vue';
</script>

<template>
  <div class="min-h-screen p-6flex justify-center">
    <div class="container max-w-(--breakpoint-lg) mx-auto">
      <div>
        <h2 class="font-semibold text-xl text-gray-600">User Information</h2>
        <p class="text-gray-500 mb-6"></p>
        <UserDetails />
      </div>
    </div>
  </div>
</template>
