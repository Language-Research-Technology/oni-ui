<template>
  <div class="grid place-items-center h-screen">
    <el-row :gutter="0" class="grid place-items-center py-6">
      <el-col :xs="1" :sm="2" :md="2" :lg="2" :xl="2"></el-col>
      <el-col :xs="7" :sm="8" :md="8" :lg="8" :xl="8" class="flex items-center justify-center">
        <div class="flex items-center justify-center">
          <img :src="alpacaSVG" alt="https://openclipart.org/artist/Arousaland"/>
        </div>
      </el-col>
      <el-col :xs="15" :sm="8" :md="8" :lg="8" :xl="8" class="flex items-center justify-center">
        <div class="flex items-center justify-center">
          <div class="text-center text-sm">
            <p class="text-4xl">{{
                message ||  'Oni is down for maintenance, please come back later'
              }}</p>
            <p class="text-2xl">
              <el-link @click="this.$router.go('/')">{{ go || 'or try again' }}</el-link>
            </p>
          </div>
        </div>
      </el-col>
      <el-col :xs="1" :sm="2" :md="2" :lg="2" :xl="2"></el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  props: ['message', 'go'],
  data() {
    return {
      alpacaSVG: require('../assets/alpaca.svg'),
    };
  },
};
</script>
