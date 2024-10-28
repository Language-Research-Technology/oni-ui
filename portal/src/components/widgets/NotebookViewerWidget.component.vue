<template>
  <h2 class="text-4xl font-normal leading-normal mt-0 mb-2 text-pink-800 self-center">Notebook Viewer</h2>
  <el-scrollbar height="800px">
    <el-row class="m-10">
      <el-col :span="24" v-html="data">
      </el-col>
    </el-row>
  </el-scrollbar>
</template>
<style>
@import "https://cdn.jsdelivr.net/npm/ipynb2html@0.3.0/dist/notebook.min.css";
@import "https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css";
@import "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.7.3/build/styles/default.min.css";
</style>
<script>
import 'element-plus/theme-chalk/display.css';
import * as ipynb2html from 'ipynb2html';
import Prism from 'prismjs';

export default {
  components: {},
  inheritAttrs: false,
  props: ['ipynb'],
  data() {
    return {
      data: '',
    };
  },
  mounted() {
    ipynb2html.highlighter = function (text, pre, code, lang) {
      const language = lang || 'text';
      pre.className = `language-${language}`;
      if (typeof code !== 'undefined') {
        code.className = `language-${language}`;
      }
      return this.highlighter(text, language);
    };
    this.parseNotebook();
  },
  updated() {
    this.parseNotebook();
  },
  methods: {
    parseNotebook() {
      try {
        //TODO: this is a test, maybe we should store as text the notebook?
        const data = atob(this.ipynb);
        const notebook = JSON.parse(data);
        this.data = ipynb2html.render(notebook).outerHTML;
      } catch (e) {
        console.warn(e);
      }
    },
    highlighter(code, lang = 'markup') {
      if (!Object.prototype.hasOwnProperty.call(Prism.languages, lang)) {
        try {
          require(`prismjs/components/prism-${lang}.js`);
        } catch (e) {
          console.warn(`** failed to load Prism lang: ${lang}`);
          Prism.languages[lang] = false;
        }
      }
      return Prism.languages[lang] ? Prism.highlight(code, Prism.languages[lang]) : code;
    },
  },
};
</script>
