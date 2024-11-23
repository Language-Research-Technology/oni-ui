<template>
  <span class="p-1 m-1">
    <span class="justify-center">
      <el-tooltip
          class="box-item"
          effect="dark"
          :content="`${field?.display}: ${item}`"
          placement="bottom"
      >
      <font-awesome-icon v-if="!special"
                         :icon="['fa-solid', iconType]"
                         size="2x"
                         style="color: rgba(0,0,0,0.55);"/>
        <manku-icon v-else :name="iconType" size="40" fill="grey"/>
      </el-tooltip>
    </span>
  </span>
</template>
<script>
export default {
  props: ['item', 'id', 'field'],
  data() {
    return {
      noIcon: false,
      iconType: 'file',
      accessIcon: 'none',
      special: false,
    };
  },
  mounted() {
    if (/text\/plain/.test(this.item)) {
      this.iconType = 'file-lines';
    } else if (/text\/csv/.test(this.item)) {
      this.iconType = 'file-csv';
    } else if (/video\/mp4/.test(this.item)) {
      this.iconType = 'file-video';
    } else if (/xml/.test(this.item)) {
      this.iconType = 'file-code';
    } else if (/application\/zip/.test(this.item)) {
      this.iconType = 'file-zipper';
    } else if (/application\/pdf/.test(this.item)) {
      this.iconType = 'file-pdf';
    } else if (/application\/msword/.test(this.item)) {
      this.iconType = 'file-word';
    } else if (/audio\/mpeg/.test(this.item) || /audio\/x-wav/.test(this.item)) {
      this.iconType = 'file-audio';
    } else if (/application\/x-ipynb+json/.test(this.item)) {
      this.iconType = 'clipboard';
    } else if (/WrittenLanguage/.test(this.item)) {
      this.iconType = 'WrittenLanguage';
      this.special = true;
    } else if (/SpokenLanguage/.test(this.item)) {
      this.iconType = 'SpokenLanguage';
      this.special = true;
    } else if (/Song/.test(this.item)) {
      this.iconType = 'fa-music';
    } else if (/Gesture/.test(this.item)) {
      this.iconType = 'fa-hand';
    } else if (/SignLanguage/.test(this.item)) {
      this.iconType = 'fa-hands-asl-interpreting';
    } else if (/WhistledLanguage/.test(this.item)) {
      this.iconType = 'fa-face-kiss';
    } else if (/public/.test(this.item)) {
      this.accessIcon = 'public';
      this.noIcon = true;
    } else if (/loginPlus/.test(this.item)) {
      this.accessIcon = 'loginPlus';
      this.noIcon = true;
    } else if (/login/.test(this.item)) {
      this.accessIcon = 'login';
      this.noIcon = true;
    } else {
      this.noIcon = true;
    }
  },
};
</script>
