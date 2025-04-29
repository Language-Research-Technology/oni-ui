<template>
  <template v-if="ui">
    <header class="sticky top-0 z-50">
      <el-row :gutter="0" :offset="0" style="" class="flex items-center justify-center">
        <el-col :xs="24" :sm="24" :md="24" :lg="22" :xl="17" :offset="0">
          <nav-view/>
        </el-col>
      </el-row>
    </header>
    <el-row :gutter="0" :offset="0" style="" class="flex items-center justify-center">
      <el-col :xs="24" :sm="24" :md="24" :lg="22" :xl="17" :offset="0">
        <main class="">
          <router-view/>
        </main>
      </el-col>
    </el-row>
    <footer>
      <footer-view/>
    </footer>
  </template>
  <template v-else>
    <MaintenacePage/>
  </template>
  <el-dialog v-model="showTerms" width="50%" center class="mt-4 mb-4" :show-close="false"
             :close-on-click-modal="false">
    <template #header>
      <h2 class="break-normal">Terms And Conditions</h2>
    </template>
    <div>
      <p class="font-bold">{{ this.terms?.description }}</p>
      <pre class="whitespace-pre-wrap py-4 mt-3">{{ this.terms?.body }}</pre>
      <br/>
      <a :href="this.terms?.url" class="break-normal underline text-blue-600" target="_blank noreferer">Terms &
        Conditions</a>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="acceptTerms">Accept Terms</el-button>
        <el-button type="info" @click="logout">Logout</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import {removeLocalStorage, putLocalStorage, getLocalStorage, tokenSessionKey} from '@/storage';
import FooterView from './Footer.component.vue';
import MaintenacePage from './MaintenacePage.vue';
import NavView from './Nav.component.vue';

export default {
  components: {
    MaintenacePage,
    NavView,
    FooterView,
  },
  beforeMount() {
  },
  async updated() {
    // Dont need to manage terms on updated
    // this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
    // if (this.isLoggedIn && this.ui.login?.manageTermsAndConditions) {
    //   await this.manageTerms();
    // }
  },
  async mounted() {
    this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
    if (this.isLoggedIn && this.ui.login?.manageTermsAndConditions) {
      await this.manageTerms();
    }
    if (this.$route.path === '/') this.$router.push('/search');
  },
  watch: {
    async '$route.path'() {
      if (this.$route.path === '/') this.$router.push('/search');
    },
  },
  data() {
    return {
      ui: this.$store.state.configuration?.ui,
      isLoggedIn: false,
      showTerms: false,
      acceptedTerms: false,
      terms: {
        id: null,
        description: '',
        body: '',
        url: ''
      }
    };
  },
  methods: {
    async manageTerms() {
      this.showTerms = false;
      try {
        const terms = await this.$terms.get();
        if (terms.error) {
          this.showTerms = false;
          throw new Error(`Error managing Terms and Conditions: ${terms.error}`);
        } else if(terms?.agreement) {
          this.terms = terms;
          this.showTerms = true;
        }
        putLocalStorage({ key: 'loginTermsURL', data: this.terms?.url });
      } catch (e) {
        removeLocalStorage({ key: 'loginTermsURL' });
        console.error(e);
      }
    },
    async acceptTerms() {
      try {
        const response = await this.$terms.accept(this.terms.id);
        //If there is an error I dont want to alert the user.
        this.showTerms = false;
        if (response.error) {
          throw new Error(`Error accepting Terms and Conditions: ${response.error}`);
        }
      } catch (e) {
        console.error(e);
      }
    },
    async logout() {
      console.log('Logout:');
      this.$store.state.user = undefined;
      removeLocalStorage({ key: tokenSessionKey });
      this.$cookies.remove('session', '/');
      removeLocalStorage({ key: 'isLoggedIn' });
      this.showTerms = false;
      await this.$router.push('/logout');
    }
  }
};
</script>
<style>
.el-dialog {
  width: unset;
  max-width: var(--el-dialog-width);
}

.el-dialog .el-dialog__body {
  max-height: calc(100svh - 350px);
  overflow: auto;
}
</style>
