<script lang="ts">
  // The projector window. It runs on the teacher's computer next to the
  // teacher console, and mirrors it over a BroadcastChannel (no network).
  import Projector from '#lib/components/Projector.svelte';
  import Brand from '#lib/components/Brand.svelte';
  import type { View } from '#lib/game/views.ts';
  import { showChannelName, type ShowMessage } from '#lib/protocol.ts';

  let view = $state.raw<View | null>(null);
  let joinUrl = $state('');
  let waited = $state(false);

  $effect(() => {
    const channel = new BroadcastChannel(showChannelName);
    channel.onmessage = (event: MessageEvent<ShowMessage>) => {
      const message = event.data;
      if (message.type === 'view') {
        if (!view || message.view.seq >= view.seq || message.view.code !== view.code) view = message.view;
        joinUrl = message.joinUrl;
      } else if (message.type === 'closed') view = null;
    };
    channel.postMessage({ type: 'hello' } satisfies ShowMessage);
    const timer = setTimeout(() => (waited = true), 1500);
    return () => {
      clearTimeout(timer);
      channel.close();
    };
  });

  async function fullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* not allowed here */
    }
  }
</script>

<svelte:head><title>{view ? `${view.code} · Projector` : 'Projector'} · 1 vs 100 Classroom</title></svelte:head>

{#if view}
  <main class="projector" ondblclick={fullscreen}>
    <Projector {view} {joinUrl} />
  </main>
{:else}
  <main class="waiting">
    <Brand />
    {#if waited}
      <h1>Projector</h1>
      <p class="lede">
        This window shows the game for the whole class. Open it from the <a href="/host">teacher console</a> on this same
        computer, then drag it onto the projector screen.
      </p>
    {:else}
      <p class="lede">Connecting to the teacher console…</p>
    {/if}
  </main>
{/if}

<style>
  .projector {
    min-height: 100vh;
  }
  .waiting {
    max-width: 36rem;
    margin: 0 auto;
    padding: 4rem 1.25rem;
    display: grid;
    gap: 1rem;
  }
  h1 {
    font-size: 2.2rem;
  }
</style>
