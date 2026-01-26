import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';

import App from './App.vue';
import router from './router';
import './assets/styles/global.scss';
import setupHorizontalScrollGuard from './utils/horizontalScrollGuard';
import BaseUpload from './components/common/BaseUpload.vue';
import FilterBar from './components/common/FilterBar.vue';
import TableCard from './components/common/TableCard.vue';
import TableWrapper from './components/common/TableWrapper.vue';

const app = createApp(App);

// Pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

// Vue Router
app.use(router);

// Element Plus
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default'
});

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.component('FilterBar', FilterBar);
app.component('BaseUpload', BaseUpload);
app.component('TableCard', TableCard);
app.component('TableWrapper', TableWrapper);

setupHorizontalScrollGuard();

app.mount('#app');
