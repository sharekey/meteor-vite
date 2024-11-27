<script lang="ts">
  import RuntimeCollection from '/imports/api/runtime';
  import { useTracker } from '/lib/MeteorSvelte.svelte';
  import { Meteor } from "meteor/meteor";
  import { LinksCollection } from '../api/links';

  let myClickCount = 0;
  const addToCounter = () => {
    myClickCount += 1;
    Meteor.call('runtime.click', (error, response) => {
        console.log('Click method call completed!', { error, response })
        if (error) {
            alert(error.message);
        }
    })
  }

  $: links = LinksCollection.find({});
  $: clicks = useTracker(() => RuntimeCollection.findOne({ _id: 'clicks' }))
  $: serverTime = useTracker(() => RuntimeCollection.findOne({ _id: 'time' }));

  const reverseTitle = (linkId) => {
    Meteor.call('links.reverse-title', linkId)
  }
</script>


<div class="container">
  <h1>Welcome to Meteor!</h1>
  <h3>The current server time is {$serverTime?.value}</h3>

  <button on:click={addToCounter}>Click Me</button>
  <p>
    You've pressed the button {myClickCount} times. In total, it has been clicked
    <span>
      {#await Meteor.subscribe('runtime')}
        (loading...)
      {:then}
        {$clicks?.value.toLocaleString()}
      {/await}
    </span>
    times.
  </p>

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
