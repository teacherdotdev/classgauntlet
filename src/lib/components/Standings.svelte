<script lang="ts">
  import Avatar from './Avatar.svelte';
  import type { Standing } from '../game/engine';
  let {
    rows,
    limit = 10,
    highlight = null,
    big = false,
  }: { rows: Standing[]; limit?: number; highlight?: string | null; big?: boolean } = $props();
</script>

<ol class="standings" class:big>
  {#each rows.slice(0, limit) as row (row.playerId)}
    <li class:me={row.playerId === highlight}>
      <span class="rank">{row.rank}</span>
      <Avatar name={row.nickname} size={big ? 40 : 28} />
      <span class="name">
        {row.nickname}
        {#if row.hasBeenOne}<span class="star" title="Has been in the Spotlight">★</span>{/if}
      </span>
      <span class="points">{row.points}</span>
    </li>
  {/each}
</ol>

<style>
  .standings {
    list-style: none;
    display: grid;
    gap: 0.35rem;
  }
  li {
    display: grid;
    grid-template-columns: 2rem auto 1fr auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0.75rem;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 10px;
    animation: rise 0.3s both;
  }
  li.me {
    border-color: var(--accent);
    background: var(--accent-wash);
  }
  .rank {
    font-family: var(--serif);
    font-weight: 700;
    color: var(--muted);
    text-align: center;
  }
  .name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .star {
    color: var(--amber-border);
  }
  .points {
    font-family: var(--serif);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .big li {
    padding: 0.55rem 1rem;
    font-size: 1.3rem;
  }
  .big li:nth-child(1) .rank {
    color: var(--accent);
  }
</style>
