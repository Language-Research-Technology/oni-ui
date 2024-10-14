<template>
  <div class="flex items-center justify-center py-32">
    <div class="bg-gray-200 w-96 h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center">
      <p>You have successfully logged out</p>
    </div>
  </div>
</template>

<script>

import {
  tokenSessionKey,
  removeLocalStorage,
  getLocalStorage
} from "@/storage";

export default {
  data() {
    return {};
  },
  mounted() {
    this.$nextTick(async function () {
      await this.logout();
    });
  },
  methods: {
    async logout() {
      console.log(`Logout:`);
      delete this.$store.state.user;
      removeLocalStorage({key: tokenSessionKey});
      this.$cookies.remove("session", '/');
      removeLocalStorage({key: 'isLoggedIn'});
      await this.$http.get({route: "/logout"});
    }
  }
};
</script>
