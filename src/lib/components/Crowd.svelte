<script lang="ts">
  // Everyone in the room as little avatars. Each can show that they've
  // answered (a gold check), that they just fell to the Comeback Crew (they
  // tumble and go grey), or that they're offline (faded).
  import Avatar from './Avatar.svelte';

  export type CrowdMember = {
    id: string;
    nickname: string;
    role: 'one' | 'mob' | 'crowd';
    connected: boolean;
    answered?: boolean;
    fell?: boolean;
  };

  let {
    people,
    size = 44,
    names = true,
    lit = true,
  }: { people: CrowdMember[]; size?: number; names?: boolean; lit?: boolean } = $props();
</script>

<ul class="crowd" class:dim={!lit} style="--s: {size}px">
  {#each people as p (p.id)}
    <li
      data-id={p.id}
      class:crew={p.role === 'crowd'}
      class:fell={p.fell}
      class:away={!p.connected}
      class:answered={p.answered}
      title="{p.nickname}{p.role === 'crowd' ? ' · Comeback Crew' : ''}"
    >
      <span class="face">
        <Avatar name={p.nickname} {size} />
        {#if p.role === 'crowd'}
          <span class="crew-badge" title="Comeback Crew" aria-label="Comeback Crew">
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /><path d="M2.5 2.5v3.6h3.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>
        {/if}
        {#if p.answered}<span class="check" aria-label="answered">✓</span>{/if}
      </span>
      {#if names}<span class="name">{p.nickname}</span>{/if}
    </li>
  {/each}
</ul>

<style>
  .crowd {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem 0.5rem;
    transition: opacity 0.6s, filter 0.6s;
  }
  .dim {
    opacity: 0.45;
    filter: saturate(0.5);
  }
  li {
    display: grid;
    justify-items: center;
    gap: 0.2rem;
    width: calc(var(--s) + 1.6rem);
    animation: pop 0.4s both;
  }
  .face {
    position: relative;
    display: block;
    border-radius: 10px;
    transition: transform 0.3s;
  }
  .answered .face {
    transform: translateY(-4px);
  }
  .crew-badge {
    position: absolute;
    right: -7px;
    top: -7px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #8a8178;
    color: #fff;
    border: 2px solid var(--night);
  }
  .fell .crew-badge {
    animation: pop 0.4s 0.6s both;
  }
  .check {
    position: absolute;
    right: -6px;
    bottom: -6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--amber-strong);
    color: var(--night);
    font-size: 0.75rem;
    font-weight: 900;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
    animation: pop 0.3s both;
  }
  .name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    font-weight: 700;
    color: inherit;
  }
  .crew .face :global(svg.avatar) {
    filter: grayscale(1) brightness(0.8);
    opacity: 0.7;
  }
  .crew .name {
    opacity: 0.55;
  }
  .fell .face {
    animation: tumble 0.9s both;
  }
  .away {
    opacity: 0.35;
  }
  @keyframes tumble {
    0% {
      filter: none;
      transform: none;
    }
    30% {
      transform: translateY(-10px) rotate(-12deg);
    }
    100% {
      transform: translateY(0) rotate(0);
    }
  }
</style>
