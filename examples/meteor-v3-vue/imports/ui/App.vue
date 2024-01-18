<template>
  <div>
    <h2>Hello from Vue!</h2>
    <div>
      <h3>Vue links</h3>
      <ul>
        <li v-for="{ title, url } in links">
          {{ title }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import LinksCollection, { LinkDocument } from '../api/links/links.collection';

const links = ref<LinkDocument[]>([]);
const ready = ref(false);
Tracker.autorun(() => {
    const subscription = Meteor.subscribe('links');
    ready.value = subscription.ready();
    links.value = LinksCollection.find({});
});
</script>