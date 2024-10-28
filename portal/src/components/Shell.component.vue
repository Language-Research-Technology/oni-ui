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
</template>

<script>
import FooterView from './Footer.component.vue';
import MaintenacePage from './MaintenacePage.vue';
import NavView from './Nav.component.vue';

export default {
  components: {
    MaintenacePage,
    NavView,
    FooterView,
  },
  beforeMount() {},
  mounted() {
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
    };
  },
};
</script>

