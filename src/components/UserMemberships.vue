<script setup lang="ts">
// @ts-nocheck
// FIXME: fix types

import { ref } from 'vue';

import EnrollmentCard from '@/components/cards/EnrollmentCard.vue';

import { configuration } from '@/configuration';

const { ui } = configuration;

const isLoading = ref(false);
const noEmrollmentDialogVisible = ref(false);
const memberships = ref([]);

const enrollmentUrl = ui.enrollment.URL;
const authorizationProvider = ui.authorizationProvider || {};

const getUserMemberships = async () => {
  isLoading.value = true;
  const membershipsStatus = { enrolled: false, memberships: [] }; // await this.$membership.set();

  //TODO: do smarter membership checks
  //If user is not enrolled need to send it to enrollmentURL if configured
  if (ui.enrollment?.enforced) {
    if (!membershipsStatus?.enrolled) {
      noEmrollmentDialogVisible.value = true;
    }
  }

  memberships.value = membershipsStatus?.memberships;
  isLoading.value = false;
};

//
getUserMemberships();
</script>

<template>
  <div class="bg-gray-100 rounded-sm shadow-lg p-4 px-4 md:p-8 mb-6">
    <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
      <div class="text-gray-600">
        <p class="font-medium text-lg">User Memberships</p>
        <p></p>
      </div>

      <div class="lg:col-span-2">
        <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
          <div class="md:col-span-5">
            <p class="p-1 m-1 text-center">You have access to the following licenses:</p>
            <br />
            <ul v-loading="isLoading" class="divide-y-2 divide-gray-100">
              <li class="p-3" v-for="item in memberships" :key="item">
                {{ item.group }}
              </li>
            </ul>
          </div>
        </div>

        <div class="md:col-span-2">
          <label for="key">&nbsp;</label>
          <div class="h-10 flex rounded-sm items-center mt-1">
            <input type="button" value="Check Memberships" id="key" name="key"
              class="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm"
              @click="getUserMemberships()" />
          </div>
          <div class="h-10 flex mt-2">
            <p>Click 'Check Memberships' to refresh your access list</p>
          </div>
        </div>
      </div>
      <div class="h-10 flex rounded-sm items-center">
        <el-link underline="always" :href="authorizationProvider?.url" target="_blank" class="mx-1"
          title="Will open in a new tab">
          Verify your access in {{ authorizationProvider?.label }}&nbsp;<font-awesome-icon
            icon="fa-solid fa-arrow-up-right-from-square" />
        </el-link>
      </div>
    </div>
  </div>
  <el-dialog v-model="noEmrollmentDialogVisible" width="50%" center>
    <el-alert :title="'Enrollment Required'" type="warning" :closable="false">
      <EnrollmentCard />
    </el-alert>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="noEmrollmentDialogVisible = false">Continue without enrollment</el-button>
      </span>
    </template>
  </el-dialog>
</template>
