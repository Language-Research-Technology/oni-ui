<template>
  <!-- component -->
  <div class="bg-gray-100 rounded-sm shadow-lg p-4 px-4 md:p-8 mb-6">
    <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
      <div class="text-gray-600">
        <p class="font-medium text-lg">User Details</p>
        <p></p>
      </div>

      <div class="lg:col-span-2">
        <div class="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
          <div class="md:col-span-5">
            <label for="full_name">Full Name</label>
            <input type="text" name="full_name" id="full_name"
                   class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50"
                   v-model="this.user.name"/>
          </div>

          <div v-if="this.user.email" class="md:col-span-5">
            <label for="email">Email Address</label>
            <input type="text" name="email" id="email" class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50"
                   v-model="this.user.email" placeholder="email@domain.com"/>
          </div>

          <div class="md:col-span-3">
            <label for="address">Organisation</label>
            <input type="text" name="address" id="address" class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50"
                   v-model="this.user.organization" placeholder=""/>
          </div>

          <div class="md:col-span-2">
            <label for="provider">Login Provider</label>
            <input type="text" name="provider" id="provider"
                   class="h-10 border mt-1 rounded-sm px-4 w-full bg-gray-50"
                   v-model="this.user.provider" placeholder="Provider"/>
          </div>

          <div class="md:col-span-3">
            <label for="api_key">API Key</label>
            <div class="h-10 bg-gray-50 flex border border-gray-200 rounded-sm items-center mt-1">
              <input name="api_key" id="api_key" :placeholder="this.apiKeyPlaceholder"
                     class="px-4 appearance-none outline-hidden text-gray-800 w-full bg-transparent"
                     v-model="this.user.apiToken"/>
              <button tabindex="-1"
                      class="cursor-pointer outline-hidden focus:outline-hidden transition-all text-gray-300 hover:text-red-600">
                <svg @click="this.removeApiToken()" class="w-4 h-4 mx-2 fill-current" xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 24 24"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="h-10 flex mt-2"><p>API Key will ony be shown once</p></div>
          </div>

          <div class="md:col-span-2">
            <label for="key">&nbsp;</label>
            <div class="h-10 flex rounded-sm items-center mt-1">
              <input type="button" value="Generate" id="key" name="key"
                     class="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm"
                     @click="this.updateApiToken()"/>
            </div>
            <div class="h-10 flex mt-2">
              <p>Click 'Generate' to register a new API key to access restricted API endpoints</p>
            </div>
          </div>

          <div v-show="this.provider === 'local'" class="md:col-span-5 text-right">
            <div class="inline-flex items-end">
              <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-sm">Save</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

</template>

<script>
export default {
  data() {
    return {
      user: {
        email: null,
        name: null,
        id: null,
      },
      provider: '',
      apiKeyPlaceholder: '*************',
    };
  },
  mounted() {
    this.$nextTick(async function () {
      await this.getUser();
    });
  },
  methods: {
    async getUser() {
      const response = await this.$http.get({ route: '/user' });
      const { user } = await response.json();
      this.user = user;
      this.provider = user.provider;
    },
    async updateApiToken() {
      const response = await this.$http.get({ route: '/user/token' });
      const { user } = await response.json();
      this.user = user;
      this.$gtag.event('/user', {
        event_category: 'user',
        event_label: 'generated-token',
        value: true,
      });
    },
    async removeApiToken() {
      const response = await this.$http.delete({ route: '/user/token' });
      const { user } = await response.json();
      this.user = user;
      this.apiKeyPlaceholder = '';
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
