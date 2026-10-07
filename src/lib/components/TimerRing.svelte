<script lang="ts">
  // A big countdown ring for the projected screen.
  let { deadline, totalMs, paused = false, size = 150 }: { deadline: number | null; totalMs: number; paused?: boolean; size?: number } = $props();
  let now = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 100);
    return () => clearInterval(timer);
  });
  const left = $derived(deadline === null ? 0 : Math.max(0, deadline - now));
  const fraction = $derived(totalMs > 0 ? left / totalMs : 0);
  const r = 44;
  const circumference = 2 * Math.PI * r;
</script>

<div class="ring" class:low={left <= 5000 && !paused} style="width: {size}px; height: {size}px" role="timer" aria-label="{Math.ceil(left / 1000)} seconds left">
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r={r} class="track" />
    <circle cx="50" cy="50" r={r} class="fill" stroke-dasharray={circumference} stroke-dashoffset={circumference * (1 - fraction)} />
  </svg>
  <span>{paused ? '❚❚' : Math.ceil(left / 1000)}</span>
</div>

<style>
  .ring {
    position: relative;
    display: grid;
    place-items: center;
  }
  svg {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
  }
  circle {
    fill: none;
    stroke-width: 9;
  }
  .track {
    stroke: rgb(255 250 243 / 0.15);
  }
  .fill {
    stroke: var(--amber-strong);
    stroke-linecap: round;
    transition: stroke-dashoffset 0.1s linear;
  }
  .low .fill {
    stroke: #e0664c;
  }
  span {
    font-family: var(--display);
    font-size: 3.4rem;
    color: var(--paper);
    line-height: 1;
  }
  .low span {
    animation: pulse 1s infinite;
  }
</style>
