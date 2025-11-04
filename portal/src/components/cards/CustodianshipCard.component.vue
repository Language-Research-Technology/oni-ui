<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5" v-if="rightsHolder && accountablePerson">
    <h5 class="text-2xl font-medium">Custodianship
      <el-tooltip class="box-item" effect="light" trigger="hover"
        content="The individual(s) or organisation(s) with the authority to make decisions regarding the collection." placement="top">
        <font-awesome-icon icon="fa-solid fa-circle-info" class="ml-2 cursor-pointer" size="xs" color="gray" />
      </el-tooltip>
    </h5>
    <hr class="divider divider-gray pt-2" />
    <h4 class="text-1xl font-medium">
      <p v-if="accountablePerson">Accountable Person: {{ accountablePerson }}</p>
      <p v-if="rightsHolder">Rights Holder: {{ rightsHolder }}</p>
    </h4>
  </el-card>
</template>

<script>

export default {
  props: ['accountablePerson', 'dct:rightsHolder'],
  data() {
    return {
      accountablePerson: this.getAccountablePerson(),
      rightsHolder: this.getRightsHolder(),
    };
  },
  methods: {
    getAccountablePerson() {
      let accountablePerson = '';
      if (Array.isArray(this.accountablePerson) && this.accountablePerson.length > 0) {
        accountablePerson = this.accountablePerson.map(a => a?.name?.[0]?.['@value'] || a?.['@value']).filter(Boolean).join(', ')
      } else {
        accountablePerson = undefined;
      }
      return accountablePerson;
    },
    getRightsHolder() {
      let rightsHolder = '';
      if (Array.isArray(this['dct:rightsHolder']) && this['dct:rightsHolder'].length > 0) {
        rightsHolder = `${this['dct:rightsHolder'].map(a => a?.name?.[0]?.['@value'] || a?.['@value']).filter(Boolean).join(', ')}`;
      } else {
        rightsHolder = undefined;
      }
      return rightsHolder;
    },
  },
};
</script>
