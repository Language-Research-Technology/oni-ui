<template>
  <el-menu-item index="login" v-show="!this.isLoggedIn" :route="'/login'">
    <router-link to="/login">
      <div class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
        <span>Login</span>
      </div>
    </router-link>
  </el-menu-item>
  <el-sub-menu v-if="this.isLoggedIn" index="login-sub">
    <template #title class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
      <font-awesome-icon icon="fa-solid fa-1x fa-user"/>&nbsp;
      <span class="items-center text-base">{{ this.userName }}&nbsp;</span>
    </template>
    <el-menu-item index="login-sub-user" :route="'/user'">
      <router-link to="/user">
        User Information
      </router-link>
    </el-menu-item>
    <el-menu-item index="logout" :route="'/logout'">
      <router-link to="/logout">
        Logout
      </router-link>
    </el-menu-item>
  </el-sub-menu>
</template>
<script>
import { getLocalStorage, removeLocalStorage, tokenSessionKey } from '@/storage';
import { ArrowDown } from '@element-plus/icons-vue';
import { find } from 'lodash';

export default {
  name: 'NavUser',
  components: {
    ArrowDown,
  },
  data() {
    return {
      user: '',
      userName: '',
      userMemberships: [],
      isLoggedIn: false,
      loading: false,
      mousedOverAlready: 0,
      errorMessages: [],
      navHeight: this.$store.state.configuration.ui?.navHeight || '50px',
    };
  },
  computed: {
    current: async function () {
      return this.$route.path;
    },
  },
  watch: {
    //lazy watcher to detect if it has been emptied and its not freshly mounted
    //TODO: not sure if we need both watchers and mounted to checkIfLoggedIn
    '$store.state.user': {
      handler() {
        this.updateUser();
      },
      flush: 'post',
      immediate: true,
    },
  },
  updated() {
    this.updateUser();
  },
  mounted() {
    this.updateUser();

  },
  methods: {
    updateUser() {
      this.isLoggedIn = getLocalStorage({ key: 'isLoggedIn' });
      this.user = this.$store.state.user;
      this.setName();
    },
    async logout() {
      await this.$router.push('/logout');
    },
    setName() {
      this.userName = this.findAndClamp(this.user, ['name', 'email']);
    },
    findAndClamp(obj, fields) {
      if (obj) {
        for (const f of fields) {
          if (obj[f]) {
            if (obj[f].length > 30) {
              return obj[f].substring(0, 30);
            }
            return obj[f];
          }
        }
      }
    },
    async mouseOver() {
      this.mousedOverAlready++;
      if (this.mousedOverAlready === 1) {
        await this.getUserMemberships();
      }
    },
    async getUserMemberships() {
      this.loading = true;
      this.userMemberships = [];
      this.errorMessages = [];
      const membershipsStatus = await this.$membership.get();
      if (membershipsStatus) {
        for (const m of membershipsStatus.memberships) {
          if (m.group) {
            this.userMemberships.push(m.group);
          }
          //TODO: I dont like this change to something better
          if (m.error) {
            this.errorMessages.push(m.error);
          }
        }
      }
      this.loading = false;
    },
  },
};
</script>
