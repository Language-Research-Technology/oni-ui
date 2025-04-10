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
  <el-dialog v-model="showTerms" width="50%" center class="mt-4 mb-4">
    <el-alert title="Terms And Conditions" type="info" :closable="false">
      <h2 class="break-normal">{{ this.terms?.description }}</h2>
      <p class="break-normal py-4 mt-3">{{ this.terms?.body }}</p>
      <br/>
      <a :href="this.terms?.url" class="break-normal" target="_blank noreferer">Open Externaly</a>
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="acceptTerms">Accept Terms</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import {getLocalStorage, removeLocalStorage, tokenSessionKey} from '@/storage';
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
    this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
    if (this.isLoggedIn) {
      await this.manageTerms();
    }
  },
  async mounted() {
    this.isLoggedIn = getLocalStorage({key: 'isLoggedIn'});
    if (this.isLoggedIn) {
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
      try {
        const response = await this.$terms.get();
        console.log(response.terms);
        if(response.terms) {
          this.showTerms = true;
          this.terms = response.terms;
        }
      } catch (e) {
        console.error(e);
      }
    },
    async acceptTerms() {
      try {
        const response = await this.$terms.accept(this.terms.id);
        console.log(response);
      } catch (e) {
        console.error(e);
      }
    }
  }
};
</script>

