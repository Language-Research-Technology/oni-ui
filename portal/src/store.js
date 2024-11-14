import { cloneDeep } from 'lodash';
import { createStore } from 'vuex';

const mutations = {
  reset: (state) => {
    state = cloneDeep(resetState());
  },
  saveConfiguration: (state, payload) => {
    state.configuration = { ...payload };
  },
  setUserData(state, payload) {
    state.user = { ...payload };
  },
  setIsLoggedIn(state, payload) {
    state.isLoggedIn = payload;
  },
};

const actions = {};

export const store = new createStore({
  state: resetState(),
  mutations,
  actions,
  modules: {},
  // plugins: [vuexLocal.plugin],
});

function resetState() {
  return {
    configuration: undefined,
    user: {},
    isLoggedIn: undefined,
  };
}
