<script setup lang="ts">
import { useRoute } from 'vue-router';

import { useConfigurationStore } from '@/stores/configuration';

import logo from '@/assets/logo.svg';

import NavUser from '@/components/NavUser.vue';

const route = useRoute();
const { ui } = useConfigurationStore();

const {
  login: { enabled: isLoginEnabled },
  shortTitle = 'Oni',
  showLogo,
  navHeight = '50px',
  topNavHome = '/search?s=',
  topNavItems = [],
  subHelpLinks = [],
  showEllipsis = false,
} = ui;
</script>

<template>
  <el-menu id="top_menu" mode="horizontal" :ellipsis="showEllipsis" :default-active="route.name" :router="true"
    :style="{ height: navHeight }">
    <el-menu-item index="home" :route="topNavHome + Date.now()">
      <router-view :key="topNavHome">
        <el-row :gutter="10" class="flex items-center justify-center min-w-md">
          <el-col :span="4">
            <div class="flex flex-col justify-center items-center" :style="{ 'height': navHeight }">
              <span>Home</span>
            </div>
          </el-col>
          <el-col :span="18">
            <span class="flex flex-col justify-center items-center" :style="{ 'height': navHeight }">
              <img v-if="showLogo" class="object-fill block" :src="logo" :srcset="logo" :style="{ 'height': navHeight }"
                :alt="shortTitle || 'Oni'" />
              <span v-else link>{{ shortTitle || 'Oni' }}</span>
            </span>
          </el-col>
        </el-row>
      </router-view>
    </el-menu-item>

    <el-menu-item class="flex-auto" />

    <el-menu-item v-for="topNavItem of topNavItems" :index="topNavItem.route" :router="topNavItem.route">
      <router-view :key="topNavItem.route">
        <el-row :gutter="10" class="flex items-center justify-center">
          <el-col :span="24">
            <div class="flex flex-col justify-center items-center" :style="{ 'height': navHeight }">
              <span>{{ topNavItem.display }}</span>
            </div>
          </el-col>
        </el-row>
      </router-view>
    </el-menu-item>

    <el-menu-item index="search" route="/search">
      <router-link to="/search">
        <el-row :gutter="10" class="flex items-center justify-center">
          <el-col :span="24">
            <div class="flex flex-col justify-center items-center" :style="{ 'height': navHeight }">
              <span>Browse</span>
            </div>
          </el-col>
        </el-row>
      </router-link>
    </el-menu-item>

    <NavUser v-if="isLoginEnabled" />

    <el-sub-menu index="help-sub">
      <template #title class="flex flex-col justify-center items-center" :style="{ 'height': navHeight }">
        <div class="flex flex-col justify-center items-center" :style="{ 'height': navHeight }">
          <span>Help</span>
        </div>
      </template>

      <el-menu-item index="help-sub-about" route="/about">
        <router-link to="/about">
          About Oni
        </router-link>
      </el-menu-item>

      <el-menu-item index="help-sub-api">
        <a href="https://johnf.github.io/ro-crate-api/">
          Oni Api docs
        </a>
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
