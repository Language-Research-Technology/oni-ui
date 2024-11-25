<template>
  <div class="flex justify-center" v-if="iconName">
    <el-tooltip class="box-item" effect="dark" :content="content" placement="bottom">
      <manku-icon :name="iconName" size="40" fill="grey"/>
    </el-tooltip>
  </div>
</template>
<script>
export default {
  props: ['accessControl'],
  data() {
    return {
      iconName: undefined,
      content: undefined,
    };
  },
  created() {
    switch (this.accessControl) {
      case 'Public':
        this.iconName = 'public';
        this.content =
          'You can access this data immediately and by doing so you accept the licence terms specified on the record.';
        break;
      case 'AgreeToTerms':
      case 'SelfAuthorization':
        this.iconName = 'login';
        this.content =
          'You can access this data after logging in. You may also have to agree to licence terms in an automatic process.';
        break;
      case 'AuthorizationByApplication':
      case 'AuthorizationByInvitation':
      case 'AccessControlList':
        this.iconName = 'loginPlus';
        this.content = 'There are restrictions on access to this data. Log in to get further information.';
        break;
    }
  },
};
</script>
