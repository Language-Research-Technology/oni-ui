<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5" v-if="this.registryJson">
    <h5 class="text-2xl font-medium">Try this Notebook</h5>
    <hr class="divider divider-gray pt-2"/>
    <div v-if="binderhubsErrors">
      <el-alert type="error" :closable="false">
        {{ binderhubsErrors }}
      </el-alert>
    </div>
    <div v-for="(item, index) in binderhubs" :key="index" class="item" >
      <el-row justify="space-between" align="middle" v-if="!item?.testOnly">
        <el-col :span="13">
          <br>
          <el-tooltip :content="item.description" placement="left">
            {{ item?.name }}
          </el-tooltip>
        </el-col>
        <el-col :span="10.5">
          <br>
          <a :href="generateUrl(item.url)" target="_blank" rel="noopener noreferrer">
            <manku-icon name="launchbinder" height="25" fill="blue"/>
          </a>
        </el-col>
        <el-col :span="1" fixed="right">
          <br>
          <el-tooltip :content="authenticationTooltip(item.authentication)" placement="right">
            <font-awesome-icon :icon="trafficIcon(item.authentication)" size="lg"
                               :style="trafficStyle(item.authentication)"/>
          </el-tooltip>
        </el-col>
      </el-row>
    </div>
  </el-card>
</template>

<script>
import { first } from 'lodash';

export default {
  props: ['gitOrg', 'gitName', 'gitBranch', 'filepath'],
  mounted() {
    if (this.gitName) {
      this.registryBinderhubs();
    }
  },
  updated() {
    // if (this.gitName) {
    //   this.registryBinderhubs();
    // }
    console.log(`binderhubs: ${this.binderhubs}`);
  },
  data() {
    return {
      binderhubs: [],
      registryJson: this.$store.state.configuration.ui.binderhubRegistry?.registryJson,
      binderhubsErrors: undefined,
    };
  },
  methods: {
    async registryBinderhubs() {
      this.binderhubsErrors = undefined;
      try {
        const response = await fetch(this.registryJson, {
          headers: {
            Accept: 'application/vnd.github.raw+json',
          },
        });
        if (response.status === 200) {
          const binderhubData = await response.json();
          this.binderhubs = binderhubData.binderhubs || [];
          this.trafficIcon();
          this.trafficStyle();
        } else {
          this.binderhubsErrors =
            'There was an error generating notebook links from GitHub, please contact your administrator.';
          console.error(await response.text());
        }
      } catch (e) {
        console.error(e);
        this.binderhubsErrors =
          'There was an error generating notebook links from GitHub, please contact your administrator.';
      }
    },
    generateUrl(baseUrl) {
      const notebookPath = `v2/gh/${first(this.gitOrg)?.['@value']}/${first(this.gitName)?.['@value']}/${first(this.gitBranch)?.['@value']}?filepath=${first(this.filepath)?.['@id']}`;
      return `${baseUrl}/${notebookPath}`;
    },
    authenticationTooltip(element) {
      if (element) {
        return 'Access: Authentication required.';
      }
      return 'Access: Authentication not required.';
    },
    // memoryTooltip(current, required) {
    //   if (current < required) {
    //     return `Insufficient memory: Only ${current} of ${required}GB provided.`;
    //   } else {
    //     return `Sufficient memory: ${current} of ${required}GB provided.`; //can add to template: + memoryTooltip(item.resources.memory.limit, 100)
    //   }
    // },
    trafficIcon(element) {
      if (element) {
        return 'fa-solid fa-circle-exclamation';
      }
      return 'fa-solid fa-circle-check';
    },
    trafficStyle(element) {
      if (element) {
        return 'color: #FFD43B;';
      }
      return 'color: #51c09f';
    },
  },
};
</script>
