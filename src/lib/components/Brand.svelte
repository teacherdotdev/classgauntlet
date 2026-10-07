<script lang="ts">
  import Logo from './Logo.svelte';
  let { href = '/', size = 30 }: { href?: string | null; size?: number } = $props();
</script>

{#if href}
  <a class="brand" {href}><Logo {size} /> <span>Class <i>Gauntlet</i></span></a>
{:else}
  <span class="brand"><Logo {size} /> <span>Class <i>Gauntlet</i></span></span>
{/if}

<style>
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--accent);
    text-decoration: none;
  }
  i {
    font-weight: 600;
    color: var(--ink-soft);
  }
</style>
