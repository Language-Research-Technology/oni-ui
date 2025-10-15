<script setup lang="ts">
const { accessControl } = defineProps<{
  accessControl?: string;
}>();

let iconName: string;
let content: string;

switch (accessControl) {
  case 'Public':
  case 'public':
    iconName = 'public';
    content =
      'You can access this data immediately and by doing so you accept the licence terms specified on the record.';
    break;
  case 'AgreeToTerms':
  case 'SelfAuthorization':
    iconName = 'login';
    content =
      'You can access this data after logging in. You may also have to agree to licence terms in an automatic process.';
    break;
  case 'AuthorizationByApplication':
  case 'AuthorizationByInvitation':
  case 'AccessControlList':
    iconName = 'loginPlus';
    content = 'There are restrictions on access to this data. Log in to get further information.';
    break;
  default:
    throw new Error(`Unknown access control type: ${accessControl}`);
}
</script>

<template>
  <div class="flex justify-center" v-if="iconName">
    <el-tooltip class="box-item" effect="light" :content="content" placement="bottom">
      <manku-icon :name="iconName" size="40" fill="grey" />
    </el-tooltip>
  </div>
</template>
