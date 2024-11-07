<template>
  <button class="bg-gray-800 w-full h-12 rounded-lg text-gray-200 uppercase font-semibold text-gray-100 transition mb-4"
          :style="this.buttonStyle" :disabled="this.disabled" @click="login()">
    {{ this.buttonText }}
  </button>
</template>

<script>
import { loginSessionKey, putLocalStorage } from '@/storage';

export default {
  props: {
    disabled: {
      type: Boolean,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      required: true,
    },
    buttonStyle: {
      type: String,
    },
    loginRoute: {
      type: String,
    },
  },
  data() {
    return {
      configuration: this.$store.state.configuration.ui.loginProviders[this.provider],
      scope: 'openid profile email',
      loggingIn: false,
    };
  },
  mounted() {},
  methods: {
    async login() {
      this.loggingIn = true;
      const response = await this.$http.get({ route: this.loginRoute });
      const { url, code_verifier } = await response.json();
      putLocalStorage({ key: loginSessionKey, data: { code_verifier } });
      window.location.href = url;
    },
  },
};
</script>
