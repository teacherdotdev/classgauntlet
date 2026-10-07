<script lang="ts">
  // The mark for each answer, so answers don't rely on colour alone:
  // A chalice, B shield, C crown, D castle.
  let { index, size = 28 }: { index: number; size?: number } = $props();
</script>

<svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" class="mark">
  {#if index === 0}
    <!-- Chalice -->
    <path d="M6 3 H26 Q26.5 13 20.5 16.5 Q17.6 18 17.6 20.5 V23.5 Q21.5 24.5 23 27 V29.5 H9 V27 Q10.5 24.5 14.4 23.5 V20.5 Q14.4 18 11.5 16.5 Q5.5 13 6 3 Z" />
    <path d="M8 7.5 H24" class="line" />
  {:else if index === 1}
    <!-- Heater shield with a cross -->
    <path d="M5 3.5 H27 V14 Q27 24.5 16 30.5 Q5 24.5 5 14 Z" />
    <path d="M16 6 V27 M8 13 H24" class="line" />
  {:else if index === 2}
    <!-- Crown -->
    <path d="M3.5 23 L5 9 L11 15.5 L16 5 L21 15.5 L27 9 L28.5 23 Z" />
    <rect x="3.5" y="24.5" width="25" height="4.5" rx="1.2" />
    <circle cx="5" cy="8" r="2" /><circle cx="16" cy="4" r="2" /><circle cx="27" cy="8" r="2" />
  {:else}
    <!-- Castle tower with battlements and a gate -->
    <path fill-rule="evenodd" d="M5 30 V7 H9.5 V11 H13.5 V7 H18.5 V11 H22.5 V7 H27 V30 Z M12.5 30 V23 Q16 18.5 19.5 23 V30 Z" />
  {/if}
</svg>

<style>
  .mark {
    flex: none;
    fill: #fff;
    filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.25));
  }
  .line {
    fill: none;
    stroke: rgb(0 0 0 / 0.22);
    stroke-width: 1.6;
    stroke-linecap: round;
  }
</style>
