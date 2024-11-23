<template>
  <span class="justify-center" v-if="accessIcon">
    <el-tooltip class="box-item" effect="dark" :content="content" placement="bottom">
      <manku-icon :name="accessIcon" size="40" fill="grey"/>
    </el-tooltip>
  </span>
</template>
<script>
export default {
  props: ['accessControl'],
  data() {
    return {
      icon: undefined,
      content: undefined,
    };
  },
  created() {
    switch (this.accessControl) {
      case 'Public':
        this.accessIcon = 'public';
        this.content =
          'You can access this data immediately and by doing so you accept the licence terms specified on the record.';
        break;
      case 'AgreeToTerms':
      case 'SelfAuthorization':
        this.accessIcon = 'login';
        this.content =
          'You can access this data after logging in. You may also have to agree to licence terms in an automatic process.';
        break;
      case 'AuthorizationByApplication':
      case 'AuthorizationByInvitation':
      case 'AccessControlList':
        this.accessIcon = 'loginPlus';
        this.content = 'There are restrictions on access to this data. Log in to get further information.';
        break;
    }
  },
};
</script>
