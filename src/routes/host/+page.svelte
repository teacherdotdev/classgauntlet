<script lang="ts">
  // The teacher's one screen, meant for the projector: pick questions, then
  // the lobby, then the game itself.
  import { onDestroy } from 'svelte';
  import { host } from '#lib/host.svelte.ts';
  import Arena from '#lib/host/Arena.svelte';
  import Lobby from '#lib/host/Lobby.svelte';
  import Picker from '#lib/host/Picker.svelte';
  import SettingsDialog from '#lib/host/SettingsDialog.svelte';
  import { spacedCode } from '#lib/protocol.ts';

  let settings: SettingsDialog;
  onDestroy(() => host.close());

  // Closing this tab ends the game for everyone, so ask first.
  function beforeUnload(event: BeforeUnloadEvent) {
    if (host.session && host.session.phase !== 'ENDED' && host.session.players.length > 0) event.preventDefault();
  }
</script>

<svelte:window onbeforeunload={beforeUnload} />
<svelte:head>
  <title>{host.session ? `PIN ${spacedCode(host.session.code)}` : 'Host a game'} · Class Gauntlet</title>
</svelte:head>

{#if !host.session}
  <Picker />
{:else}
  <div class="hall">
    {#if host.session.phase === 'LOBBY'}
      <Lobby onsettings={() => settings.open()} />
    {:else if host.view}
      <Arena onsettings={() => settings.open()} />
    {/if}
  </div>
  <SettingsDialog bind:this={settings} />
{/if}

<style>
  /* A torch-lit hall: dark stone with warm light from above. */
  .hall {
    min-height: 100vh;
    background:
      radial-gradient(ellipse 70% 50% at 50% -10%, rgb(240 170 90 / 0.22), transparent 70%),
      radial-gradient(ellipse 40% 40% at 0% 100%, rgb(159 80 55 / 0.25), transparent 70%),
      radial-gradient(ellipse 40% 40% at 100% 100%, rgb(47 93 143 / 0.18), transparent 70%),
      var(--night);
  }
</style>
