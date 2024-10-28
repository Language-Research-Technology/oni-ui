<template>
  <router-view/>
</template>

<script>
import { getLocalStorage, putLocalStorage, tokenSessionKey } from '@/storage';
export default {
  data() {
    return {};
  },
  mounted() {
    this.setup();
  },
  methods: {
    async setup() {
      const isAuthed = await this.$http.get({ route: '/authenticated' });
      if (isAuthed.status === 200) {
        const { token } = getLocalStorage({ key: tokenSessionKey });
        const user = JSON.parse(atob(token.split('.')[1]));
        this.$store.commit('setUserData', user);
      } else {
        this.$store.commit('isLoggedIn', false);
        putLocalStorage({ key: 'isLoggedIn', data: false });
      }
    },
  },
};
</script>

<!--
TODO: Read
[VueJS 3](https://v3.vuejs.org/guide/introduction.html)
[Vue-router](https://next.router.vuejs.org/)
[Vuex (state management)](https://next.vuex.vuejs.org/)
[Font Awesome Icons](https://fontawesome.com/v5.15/icons?d=gallery&p=2&m=free)
[Element Plus UI Controls](https://element-plus.org/en-US/component/border.html)
[TailwindCSS - bootstrap on steroids](https://tailwindcss.com/docs)
-->
