<script setup lang="ts">
import { useRoute } from 'vue-router';
import logo from '@/assets/logo.svg';
import NavUser from '@/components/NavUser.vue';
import { ui } from '@/configuration';

const route = useRoute();

const {
  login: { enabled: isLoginEnabled },
  shortTitle = 'Oni',
  logoFilename,
  navHeight = '50px',
  topNavHome = '/search?s=',
  topNavItems = [],
  subHelpLinks = [],
  showEllipsis = false,
} = ui;

const logoSrc = logoFilename ? `/${logoFilename}` : logo;
</script>

<template>
  <el-menu id="top_menu" mode="horizontal" :ellipsis="showEllipsis" :default-active="route.name" :router="true"
    :style="{ height: navHeight }">
    <el-menu-item index="home" :route="topNavHome + Date.now()">
      <router-view :key="topNavHome">
        <el-row :gutter="10" class="flex items-center min-w-md gap-8" :style="{ 'height': navHeight }">
          <img class="h-full w-auto object-cover py-2" :src="logoSrc" :alt="shortTitle || 'Oni'" />
          <span>Home</span>
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

      <el-menu-item>
        <a href="https://johnf.github.io/ro-crate-api/" target="_blank">
          Ro-Crate API Docs
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
