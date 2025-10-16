<template>
  <el-menu
      id="top_menu"
      mode="horizontal"
      :ellipsis="showEllipsis"
      :default-active="active"
      :router="true"
  >
    <el-menu-item index="home" :route="topNavHome + Date.now()">
      <router-view :key="topNavHome">
        <el-row :gutter="10" class="flex items-center justify-center min-w-md">
          <el-col :span="4">
            <div class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
              <span>Home</span>
            </div>
          </el-col>
          <el-col :span="18">
          <span class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
            <img v-if="showLogo" class="object-fill block" :src="logo" :srcset="logo" :style="{'height': navHeight}"
                 :alt="this.$store.state.configuration.ui.shortTitle || 'Oni'"/>
            <span v-else link>{{ this.$store.state.configuration.ui.shortTitle || 'Oni' }}</span>
          </span>
          </el-col>
        </el-row>
      </router-view>
    </el-menu-item>
    <el-menu-item class="flex-auto"/>
    <el-menu-item v-for="topNavItem of topNavItems" :index="topNavItem.route" :router="topNavItem.route">
      <router-view :key="topNavItem.route">
        <el-row :gutter="10" class="flex items-center justify-center">
          <el-col :span="24">
            <div class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
              <el-tooltip v-if="topNavItem.tooltip" :content="topNavItem.tooltip" placement="bottom" effect="light">
                <span>{{ topNavItem.display }}</span>
              </el-tooltip>
              <span v-else>{{ topNavItem.display }}</span>
            </div>
          </el-col>
        </el-row>
      </router-view>
    </el-menu-item>
    <el-menu-item index="search" :route="'/search'">
      <router-link to="/search">
        <el-row :gutter="10" class="flex items-center justify-center">
          <el-col :span="24">
            <div class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
              <el-tooltip class="box-item" effect="light" content="View all collections, sub-collections, objects, files and notebooks." placement="bottom">
              <span>Browse</span>
            </el-tooltip>
          </div>
        </el-col>
      </el-row>
    </router-link>
    </el-menu-item>
    <nav-user v-if="isLoginEnabled"/>
    <el-sub-menu index="help-sub">
      <template #title class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
        <div class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
          <el-tooltip class="box-item" effect="light" content="View help and further information about the Oni portal." placement="right">
            <span>Help</span>
          </el-tooltip>
        </div>
      </template>
      <el-menu-item index="help-sub-about" :route="'/about'">
        <router-link to="/about">
          About Oni
        </router-link>
      </el-menu-item>
      <el-menu-item index="help-sub-api" :route="'/docs'">
        <router-link to="/docs">
          Oni Api docs
        </router-link>
      </el-menu-item>
      <template v-for="helpLink of subHelpLinks">
        <li class="el-menu-item">
          <a class="w-full block" :href="helpLink.href" :target="helpLink.target">
            {{ helpLink.name }}
          </a>
        </li>
      </template>
    </el-sub-menu>
  </el-menu>
</template>
<style>
.el-menu-item a {
  display: block;
}
</style>
<script>
import logo from '@/assets/logo.svg';
import { getLocalStorage, removeLocalStorage, tokenSessionKey } from '@/storage';
import { defineAsyncComponent, toRaw } from 'vue';
import NavUser from './NavUser.component.vue';

export default {
  name: 'NavView',
  components: {
    NavUser,
  },
  data() {
    return {
      isLoginEnabled: this.$store.state.configuration.ui?.login?.enabled,
      showLogo: this.$store.state.configuration.ui?.showLogo,
      showNotebooks: this.$store.state.configuration.ui?.showNotebooks,
      navHeight: this.$store.state.configuration.ui?.navHeight || '50px',
      topNavHome: this.$store.state.configuration.ui?.topNavHome || '/search?s=',
      topNavItems: this.$store.state.configuration.ui?.topNavItems || [],
      subHelpLinks: this.$store.state.configuration.ui?.subHelpLinks || [],
      showEllipsis: this.$store.state.configuration.ui?.showEllipsis || false,
      logo,
      active: '',
      populate: null,
      searchInput: null,
      search: null,
      clear: null,
      filters: null,
      onInputChange: null,
    };
  },
  computed: {
    current: async function () {
      return this.$route.path;
    },
  },
  watch: {
    '$route.query.view': {
      handler() {
        this.activate();
      },
      flush: 'post',
      immediate: true,
    },
    '$route.query': {
      handler() {
        this.activate();
      },
      flush: 'post',
      immediate: true,
    },
  },
  mounted() {},
  methods: {
    activate: function () {
      if (this.$route.name === this.topNavHome) {
        this.active = this.topNavHome;
      } else {
        this.active = this.$route.name;
        console.log(`Active Route: ${this.active}`);
      }
    },
  },
};
</script>
