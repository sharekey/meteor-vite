import { Meteor } from 'meteor/meteor'
import { createSSRApp } from 'vue';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';

import App from './App.vue'
import { routes } from './router';

export function createApp() {
  const router = createRouter({
    history: Meteor.isClient ? createMemoryHistory() : createWebHistory(),
    routes,
  });
  
  const app = createSSRApp(App);
  
  app.use(router);
  
  return { app, router };
}