<script lang="ts">
  // The waiting room, on the projector: where to go, the PIN, a QR code, and
  // everyone who has joined. Tap a name to choose the first challenger or to
  // remove them.
  import Avatar from '../components/Avatar.svelte';
  import Gauntlet from '../components/Gauntlet.svelte';
  import QrCode from '../components/QrCode.svelte';
  import { host } from '../host.svelte';
  import { spacedCode } from '../protocol';

  let { onsettings }: { onsettings: () => void } = $props();

  const s = $derived(host.session!);
  const players = $derived(s.players);
  const site = $derived(host.joinUrl.replace(/^https?:\/\//, '').replace(/\/join.*/, ''));
  let menuFor = $state('');

  function choose(id: string) {
    host.run((e) => e.chooseNextOne(s.pendingNextOneId === id ? null : id));
    menuFor = '';
  }
</script>

<div class="lobby">
  <header class="banner">
    <div class="where">
      <span class="label">Join at</span>
      <strong>{site}</strong>
    </div>
    <div class="pin">
      <span class="label">Game PIN</span>
      <strong aria-label="Game PIN {s.code.split('').join(' ')}">{spacedCode(s.code)}</strong>
    </div>
    <div class="qr"><QrCode text={host.joinUrl} label="Scan to join" /></div>
  </header>

  {#if host.status !== 'open'}
    <p class="status" role="status">
      {host.status === 'reclaiming' ? 'Getting your game PIN back…' : host.status === 'opening' ? 'Opening the game…' : host.problem || 'Reconnecting…'}
    </p>
  {/if}

  <div class="bar">
    <button class="icon-btn" onclick={onsettings} aria-label="Settings" title="Settings">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    </button>
    <span class="count"><strong>{players.length}</strong> {players.length === 1 ? 'player' : 'players'}</span>
    <span class="title">{s.setTitle}</span>
    <button class="start" disabled={players.length < 2} onclick={() => host.run((e) => e.startGame())}>
      Start
    </button>
  </div>

  {#if players.length === 0}
    <div class="empty">
      <Gauntlet size={170} />
      <p>Waiting for challengers…</p>
    </div>
  {:else}
    <ul class="players">
      {#each players as p (p.id)}
        <li class:away={!p.connected} class:picked={s.pendingNextOneId === p.id}>
          <button class="chip" onclick={() => (menuFor = menuFor === p.id ? '' : p.id)} aria-expanded={menuFor === p.id}>
            <Avatar name={p.nickname} size={34} />
            <span>{p.nickname}</span>
            {#if s.pendingNextOneId === p.id}<span class="badge" title="Goes first">⚔</span>{/if}
          </button>
          {#if menuFor === p.id}
            <div class="menu">
              <button onclick={() => choose(p.id)}>{s.pendingNextOneId === p.id ? 'Let the spotlight choose' : 'Make them the challenger'}</button>
              <button class="danger" onclick={() => { host.kick(p.id); menuFor = ''; }}>Remove</button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="hint">
      {players.length < 2 ? 'You need at least two players.' : s.pendingNextOneId ? '' : 'When you start, the spotlight picks the first challenger. Tap a name to choose instead.'}
    </p>
  {/if}
</div>

<style>
  .lobby {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem clamp(1rem, 3vw, 2.5rem) 2rem;
    color: var(--paper);
  }
  .banner {
    align-self: center;
    display: flex;
    align-items: center;
    gap: clamp(1rem, 3vw, 2.5rem);
    padding: 1rem 1.25rem 1rem 2rem;
    background: var(--paper);
    color: var(--ink);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgb(0 0 0 / 0.35);
    border: 3px solid var(--or);
    max-width: 100%;
  }
  .where,
  .pin {
    display: grid;
  }
  .where strong {
    font-size: clamp(1.2rem, 2.2vw, 2rem);
  }
  .pin {
    padding-left: clamp(1rem, 3vw, 2.5rem);
    border-left: 2px solid var(--line);
  }
  .pin strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(3rem, 7vw, 6.5rem);
    line-height: 0.95;
    letter-spacing: 0.04em;
    color: var(--accent-dark);
    font-variant-numeric: tabular-nums;
  }
  .label {
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .qr {
    width: clamp(6rem, 11vw, 9.5rem);
    background: #fff;
    padding: 0.4rem;
    border-radius: 8px;
  }
  .qr :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
  .status {
    text-align: center;
    color: var(--amber-strong);
    font-weight: 600;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 12px;
    border: 1px solid rgb(255 250 243 / 0.25);
    background: rgb(255 250 243 / 0.08);
    color: var(--paper);
    cursor: pointer;
  }
  .icon-btn:hover {
    background: rgb(255 250 243 / 0.18);
  }
  .count {
    font-size: 1.2rem;
    background: rgb(255 250 243 / 0.1);
    padding: 0.5rem 1rem;
    border-radius: 999px;
  }
  .count strong {
    font-family: var(--display);
    font-weight: 400;
    font-size: 1.6rem;
  }
  .title {
    flex: 1;
    text-align: center;
    color: rgb(255 250 243 / 0.6);
    font-family: var(--serif);
    font-style: italic;
  }
  .start {
    font: inherit;
    font-weight: 800;
    font-size: 1.3rem;
    padding: 0.8rem 2.4rem;
    border-radius: 12px;
    border: none;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    box-shadow: inset 0 -5px 0 rgb(0 0 0 / 0.18);
  }
  .start:hover:not(:disabled) {
    background: #fff;
  }
  .start:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .empty {
    flex: 1;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 1rem;
    opacity: 0.85;
  }
  .empty p {
    font-family: var(--display);
    font-size: 2.2rem;
  }
  .players {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    align-content: flex-start;
  }
  li {
    position: relative;
    animation: pop 0.35s both;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 1.1rem 0.35rem 0.35rem;
    border-radius: 999px;
    border: 2px solid transparent;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-weight: 800;
    font-size: 1.15rem;
    cursor: pointer;
  }
  .chip:hover {
    text-decoration: line-through;
    text-decoration-color: rgb(51 42 36 / 0.25);
  }
  .picked .chip {
    border-color: var(--amber-strong);
    box-shadow: 0 0 0 4px rgb(240 210 124 / 0.35);
  }
  .badge {
    color: var(--accent);
  }
  .away {
    opacity: 0.5;
  }
  .menu {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    display: grid;
    min-width: 13rem;
    padding: 0.35rem;
    background: var(--paper);
    border-radius: 10px;
    box-shadow: var(--shadow-dialog);
  }
  .menu button {
    text-align: left;
    background: none;
    border: none;
    padding: 0.55rem 0.75rem;
    border-radius: 6px;
    font: inherit;
    color: var(--ink);
    cursor: pointer;
  }
  .menu button:hover {
    background: var(--paper-low);
  }
  .menu .danger {
    color: var(--bad);
  }
  .hint {
    text-align: center;
    color: rgb(255 250 243 / 0.6);
  }
  @media (max-width: 52rem) {
    .banner {
      flex-wrap: wrap;
      justify-content: center;
      padding: 1rem;
    }
    .pin {
      border-left: none;
      padding-left: 0;
    }
    .title {
      display: none;
    }
  }
</style>
