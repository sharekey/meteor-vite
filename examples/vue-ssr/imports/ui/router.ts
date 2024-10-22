import { type RouteRecordRaw } from 'vue-router';
import About from './About.vue';
import Home from './Home.vue';

export const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/about',
    name: 'about',
    component: About,
  },
] satisfies RouteRecordRaw[];
