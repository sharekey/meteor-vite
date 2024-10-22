import Links from '/imports/ui/pages/Links.vue';
import { type RouteRecordRaw } from 'vue-router';
import About from './pages/About.vue';
import Home from './pages/Home.vue';

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
  {
    path: '/links',
    name: 'links',
    component: Links,
  }
] satisfies RouteRecordRaw[];
