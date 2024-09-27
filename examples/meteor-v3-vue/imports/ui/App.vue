<template>
  <div>
    <h2>Vue App</h2>
    <p>
      The following content is rendered entirely by Vite's <b>Vue</b> plugin.
    </p>
  </div>
  <div class="divide-y-2 flex flex-col gap-12">
    <section>
      <h3>Vue links</h3>
      <p>
        Uses <code>meteor-type-validation</code> for schema validation and method/publication type inference.
      </p>
      <ul>
        <li v-for="{ title, url } in links.data">
          <a :href="url">{{ title }}</a>
        </li>
      </ul>
      <form @submit.prevent="links.create()" class="flex gap-2">
        <label class="flex-grow">
          <span class="block">Title</span>
          <input class="w-full" v-model="links.form.title" placeholder="Something important">
        </label>
        <label class="flex-grow">
          <span class="block">URL</span>
          <input class="w-full" v-model="links.form.url" placeholder="https://example.com/...">
        </label>
        <button type="submit" class="place-self-end">
          Submit
        </button>
      </form>
    </section>

    <section>
      <h3>Vue Chat</h3>
      <p>
        Uses <code>zodern:relay</code> to load and send messages.
      </p>
      <div class="my-7 p-6 rounded-lg bg-gray-100 min-h-64 max-h-96 overflow-y-auto">
        <div v-for="message in chat.data">
          <div>{{ message.content || '(no content)' }}</div>
          <div class="text-sm text-gray-500">{{ formatRelativeTime(message.createdAt) }}</div>
        </div>
      </div>
      <form class="flex gap-2" @submit.prevent="chat.send()">
        <input class="w-full" type="text" v-model="chat.form.content" placeholder="Type your message here">
        <button type="submit">Send</button>
      </form>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { ChatCollection, type ChatDocument } from '../api/chat/collection';
import LinksCollection, { LinkDocument } from '../api/links/links.collection';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { sendMessage } from '../api/relay/methods/chat';
import { subscribeToChat } from '../api/relay/publications/chat';
import { formatRelativeTime } from './composition/Helpers';

const links = reactive({
    data: [] as LinkDocument[],
    ready: false,
    form: {
        title: '',
        url: '',
    },
    async create() {
        await Meteor.callAsync('links.create', links.form);
    },
});

const chat = reactive({
    data: [] as ChatDocument[],
    ready: false,
    form: {
        content: '',
    },
    async send() {
        await sendMessage(chat.form);
        chat.form.content = '';
    },
});

Tracker.autorun(() => {
    const linksSubscription = Meteor.subscribe('links');
    links.ready = linksSubscription.ready();
    links.data = LinksCollection.find({}).fetch();
});

Tracker.autorun(() => {
    const subscription = subscribeToChat({
        query: {},
    });
    chat.ready = subscription.ready();
    chat.data = ChatCollection.find({}).fetch();
})
</script>