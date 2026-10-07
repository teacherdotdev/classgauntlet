<script lang="ts">
  // Poll the Class (a tally), Ask Two (two speech bubbles), Go with the Class (a banner).
  let { help, size = 24 }: { help: 'poll' | 'ask' | 'trust'; size?: number } = $props();
</script>

<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  {#if help === 'poll'}
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  {:else if help === 'ask'}
    <path d="M3 5h10v7H7l-4 3z" /><path d="M17 9h4v8l-3-2h-6v-3" />
  {:else}
    <path d="M5 21V3" /><path d="M5 4h13l-3 4 3 4H5" />
  {/if}
</svg>
