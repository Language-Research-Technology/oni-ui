<script setup lang="ts">
import { RouterView } from 'vue-router';

// import { getLocalStorage, putLocalStorage, removeLocalStorage, tokenSessionKey } from '@/storage';
// import { ElNotification } from 'element-plus';

// export default {
//   data() {
//     return {
//       sessionCookie: null,
//       checkInterval: null,
//     };
//   },
//   mounted() {
//     this.setup();
//     this.checkInterval = setInterval(this.checkSessionCookie, 3600000); // Check every 1 hr
//   },
//   watch: {
//     sessionCookie(newVal, oldVal) {
//       if (!newVal) {
//         console.log('Session expired or user logged out.');
//         // Handle session expiration or redirection here
//         const isLoggedIn = getLocalStorage({ key: 'isLoggedIn' });
//         if (isLoggedIn) {
//           ElNotification({
//             title: 'Session Timeout',
//             message: 'Your session has timed-out, please login again',
//             duration: 0,
//           });
//         }
//       }
//     },
//   },
//   methods: {
//     async setup() {
//       // NOTE: Temp disable auth
//       // const isAuthed = await this.$http.get({route: "/authenticated"});
//       // if (isAuthed.status === 200) {
//       //   const {token} = getLocalStorage({key: tokenSessionKey});
//       //   const user = JSON.parse(atob(token.split(".")[1]));
//       //   this.$store.commit("setUserData", user);
//       // } else {
//       //   this.$store.commit("isLoggedIn", false);
//       //   putLocalStorage({key: 'isLoggedIn', data: false});
//       // }
//     },
//   },
//   checkSessionCookie() {
//     const currentCookie = this.$cookies.get('session');
//     if (currentCookie !== this.sessionCookie) {
//       this.sessionCookie = currentCookie;
//       // Additional actions can be triggered here if needed
//     }
//   },
//   beforeDestroy() {
//     // Clear the interval when the component is destroyed
//     if (this.checkInterval) {
//       clearInterval(this.checkInterval);
//     }
//   },
// };
</script>

<template>
        <RouterView />
</template>
