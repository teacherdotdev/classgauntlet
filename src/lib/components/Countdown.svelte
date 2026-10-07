<script lang="ts">
  // Seconds left until `deadline` (this device's clock), ticking on its own.
  let { deadline, paused = false, big = false }: { deadline: number | null; paused?: boolean; big?: boolean } = $props();
  let now = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 200);
    return () => clearInterval(timer);
  });
  const seconds = $derived(deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000)));
</script>

{#if seconds !== null || paused}
  <span class="clock" class:big class:low={seconds !== null && seconds <= 5} aria-live="off">
    {paused ? 'Paused' : `${seconds}s`}
  </span>
{/if}

<style>
  .clock {
    background: var(--accent-wash);
    color: var(--accent-dark);
    padding: 0.15rem 0.6rem;
    border-radius: 6px;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
  .big {
    font-family: var(--serif);
    font-size: clamp(1.6rem, 3vw, 2.6rem);
    padding: 0.2rem 0.9rem;
    border-radius: 10px;
  }
  .low {
    background: var(--bad-wash);
    color: var(--bad);
  }
</style>
