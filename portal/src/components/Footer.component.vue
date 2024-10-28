<template>
  <div class="h-24 text-center bg-gray-50 grid place-items-center ">
    <el-row>
      <el-col :span="24">
        <span>{{ copyright }}</span>&nbsp;
        <a class="text-gray-600 font-semibold" :href="href">{{ hrefText }}</a>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24" class="flex space-x-4">
        <el-link v-if="terms"
                 class="text-gray-600 font-semibold"
                 :href="terms?.href"
                 :underline="false">{{
            terms?.title
          }}
        </el-link>
        <el-link v-if="splashLauncher"
                 class="text-gray-600 font-semibold"
                 @click="splash=true"
                 :underline="false">
          {{ splashLauncher || 'Splash' }}
        </el-link>
        <el-link v-if="privacy"
                 class="text-gray-600 font-semibold"
                 :href="privacy?.href"
                 :underline="false">{{
            privacy?.title
          }}
        </el-link>
      </el-col>
    </el-row>
  </div>
  <splash-screen :launch="splash" @close="splash=false"/>
</template>
<script>
import SplashScreen from './SplashScreen.component.vue';

export default {
  name: 'FooterView',
  components: { SplashScreen },
  data() {
    return {
      copyright: this.$store.state.configuration.ui.footer.copyright,
      href: this.$store.state.configuration.ui.footer.link.href,
      hrefText: this.$store.state.configuration.ui.footer.link.text,
      terms: this.$store.state.configuration.ui?.terms || null,
      privacy: this.$store.state.configuration.ui?.privacy || null,
      splash: false,
      splashLauncher: this.$store.state.configuration.ui?.splashLauncher || null,
    };
  },
};
</script>
