<template>
  <!-- component -->
  <div class="min-h-screen p-6flex justify-center">
    <div class="container max-w-screen-lg mx-auto">
      <div>
        <br>
        <h2 class="font-semibold text-xl text-gray-600">User Information</h2>
        <p class="text-gray-500 mb-6"></p>
        <user-details/>
        <user-memberships/>
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

export default {
  components: {
    UserDetails: defineAsyncComponent(() => import('@/components/UserDetails.component.vue')),
    UserMemberships: defineAsyncComponent(() => import('@/components/UserMemberships.component.vue')),
  },
  data() {
    return {};
  },
  mounted() {},
  methods: {},
};
</script>

<!--
TODO: Read
[VueJS 3](https://v3.vuejs.org/guide/introduction.html)
[Vue-router](https://next.router.vuejs.org/)
[Vuex (state management)](https://next.vuex.vuejs.org/)
[Font Awesome Icons](https://fontawesome.com/v5.15/icons?d=gallery&p=2&m=free)
[Element Plus UI Controls](https://element-plus.org/en-US/component/border.html)
[TailwindCSS - bootstrap on steroids](https://tailwindcss.com/docs)
-->
