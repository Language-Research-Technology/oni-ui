<template>
  <div class="w-full h-screen flex items-center justify-center">
    <div class="bg-gray-200 w-96 h-auto rounded-lg pt-8 pb-8 px-8 flex flex-col items-center drop-shadow-md">
      <label class="font-light text-4xl mb-4">{{ siteName }}<span class='font-bold'>{{ siteNameX }}</span></label>
      <br/>
      <oauth-login-component
          v-for="provider of loginProviders"
          :key="provider.name"
          :disabled="provider.disabled"
          :provider="provider.name"
          :buttonStyle="provider.buttonStyle"
          :button-text="provider.text"
          :loginRoute="provider.loginRoute"
      />
      <button class="text-gray-800 mb-4 pointer" @click="toggleAdmin()">Admin login</button>
      <div :class="this.showAdmin ? 'block': 'hidden'">
        <input type="text" class="w-full h-12 rounded-lg px-4 text-lg focus:ring-blue-600 mb-4" placeholder="Email"/>
        <input type="password" class="w-full h-12 rounded-lg px-4 text-lg focus:ring-blue-600 mb-4"
               placeholder="Password"/>
        <button
            class="w-full h-12 rounded-lg bg-blue-600 text-gray-200 uppercase font-semibold hover:bg-blue-700 text-gray-100 transition mb-4"
            disabled="true">Admin Login
        </button>
        <p class="text-right mb-4">Forgot password</p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

export default {
  components: {
    OauthLoginComponent: defineAsyncComponent(() => import('@/components/authentication/OauthLogin.component.vue')),
  },
  data() {
    return {
      siteName: this.$store.state.configuration.ui.siteName,
      siteNameX: this.$store.state.configuration.ui.siteNameX || '',
      loginProviders: this.$store.state.configuration.ui.loginProviders,
      showAdmin: false,
    };
  },
  mounted() {},
  methods: {
    toggleAdmin() {
      this.showAdmin = !this.showAdmin;
    },
  },
};
</script>
