<template>
  <router-view/>

</template>

<script>
import {tokenSessionKey, getLocalStorage, putLocalStorage, removeLocalStorage} from "@/storage";

export default {
  data() {
    return {};
  },
  mounted() {
    this.setup();
  },
  methods: {
    async setup() {
      let isAuthed = await this.$http.get({route: "/authenticated"});
      if (isAuthed.status === 200) {
        let {token} = getLocalStorage({key: tokenSessionKey});
        let user = JSON.parse(atob(token.split(".")[1]));
        this.$store.commit("setUserData", user);
        const hasSession = this.$cookies.get('session');
        if(!hasSession) {
          removeLocalStorage({key: tokenSessionKey});
          removeLocalStorage({key: 'isLoggedIn'});
        }
      } else {
        this.$store.commit("isLoggedIn", false);
        putLocalStorage({key: 'isLoggedIn', data: false});
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
