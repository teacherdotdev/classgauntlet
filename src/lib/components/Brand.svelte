<script lang="ts">
  import Gauntlet from './Gauntlet.svelte';
  let { href = '/', size = 34, light = false }: { href?: string | null; size?: number; light?: boolean } = $props();
</script>

<svelte:element this={href ? 'a' : 'span'} {href} class="brand" class:light>
  <span class="mark"><Gauntlet size={size} tilt={-14} /></span>
  <span class="word">Class Gauntlet</span>
</svelte:element>

<style>
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--ink);
    text-decoration: none;
  }
  .mark {
    display: block;
    line-height: 0;
  }
  .word {
    font-family: var(--display);
    font-size: 1.6rem;
    line-height: 1;
  }
  .light {
    color: var(--paper);
  }
</style>
