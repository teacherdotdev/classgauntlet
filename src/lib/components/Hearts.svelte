<script lang="ts">
  // Strikes left, drawn as filled and empty hearts so it reads from the back row.
  let { left, total }: { left: number; total: number } = $props();
</script>

<span class="hearts" aria-label="{left} of {Math.max(total, left)} chances left">
  {#each Array.from({ length: Math.max(total, left) }, (_, i) => i) as i (i)}
    <span class:empty={i >= left} aria-hidden="true">♥</span>
  {/each}
</span>

<style>
  .hearts {
    color: var(--accent);
    letter-spacing: 0.08em;
  }
  .empty {
    color: var(--line-strong);
  }
</style>
