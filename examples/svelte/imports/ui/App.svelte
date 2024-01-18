<script lang="ts">
  import RuntimeCollection from '/imports/api/runtime';
  import { Meteor } from "meteor/meteor";
  import { LinksCollection } from '../api/links';

  Meteor.subscribe('runtime');

  let counter = 0;
  const addToCounter = () => {
    counter += 1;
    Meteor.call('runtime.click', (error, response) => {
        console.log('Click method call completed!', { error, response })
        if (error) {
            alert(error.message);
        }
    })
  }

  $: links = LinksCollection.find({});
  $: clicks = RuntimeCollection.findOne({ _id: 'clicks' })?.value;

  const reverseTitle = (linkId) => {
    Meteor.call('links.reverse-title', linkId)
  }
</script>


<div class="container">
  <h1>Welcome to Meteor!</h1>

  <button on:click={addToCounter}>Click Me</button>
  <p>You've pressed the button {clicks} times.</p>

  <h2>Learn Meteor!</h2>
  {#await Meteor.subscribe('links.all')}
    <div>Waiting on links...</div>
  {:then}
    <ul>
      {#each $links as link (link._id)}
        <li>
          <a href={link.url} target="_blank" rel="noreferrer">{link.title}</a>
          <button on:click={() => { reverseTitle(link._id) }}>Reverse</button>
        </li>
      {/each}
    </ul>
  {/await}

  <h2>Typescript ready</h2>
  <p>Just add lang="ts" to .svelte components.</p>
</div>
