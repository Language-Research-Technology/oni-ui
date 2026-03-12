<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import alpacaSVG from '@/assets/alpaca.svg';
import { ui } from '@/configuration';

const { t } = useI18n();
const router = useRouter();

const errorPageImage = ui.features?.errorPageImage;
const showImage = errorPageImage !== false;
const imageSrc = typeof errorPageImage === 'string' ? errorPageImage : alpacaSVG;
const textColSpan = showImage ? 12 : 20;
</script>

<template>
  <el-row :gutter="0" class="grid place-items-center py-6">
    <el-col :xs="1" :sm="2" :md="2" :lg="2" :xl="2"></el-col>
    <!-- Alpaca SVG by Arousaland: https://openclipart.org/artist/Arousaland -->
    <el-col v-if="showImage" :xs="7" :sm="8" :md="8" :lg="8" :xl="8" class="flex items-center justify-center">
      <img :src="imageSrc" alt="Alpaca" />
    </el-col>
    <el-col :xs="showImage ? 15 : 22" :sm="textColSpan" :md="textColSpan" :lg="textColSpan" :xl="textColSpan" class="flex items-center justify-center">
      <div class="text-center text-sm">
        <p class="text-2xl">{{ t('errors.pageNotFound') }}</p>
        <p class="text-2xl">{{ t('errors.pageNotFoundMessage') }}</p>
        <p class="text-2xl"><el-link @click="router.push('/')">{{ t('errors.goHome') }}</el-link></p>
      </div>
    </el-col>
    <el-col :xs="1" :sm="2" :md="2" :lg="2" :xl="2"></el-col>
  </el-row>
</template>
