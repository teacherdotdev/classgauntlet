<script lang="ts">
  // A sheet of paper drawn like Morphology Mash's logo: cream on a warm tan edge,
  // with a big serif 1 standing apart from a crowd of small dots (the 100).
  let { size = 30 }: { size?: number } = $props();
</script>

<svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
  <path d="M4 4.5 Q4 2.5 6 2.5 H26 Q28.5 2.5 28.5 5 V28 Q28.5 31 25.5 31 H7 Q4 31 4 28 Z" fill="#cdb699" />
  <path d="M4 3 Q4 1 6 1 H26 Q28.5 1 28.5 3.5 V26.5 Q28.5 29 25.5 29 H7 Q4 29 4 26.5 Z" fill="#fffaf3" stroke="#e0d3c2" stroke-width="0.75" />
  <text x="11" y="23" font-family="Literata, Georgia, serif" font-size="19" font-weight="700" text-anchor="middle" fill="#9f5037">1</text>
  {#each [0, 1, 2] as row (row)}
    {#each [0, 1, 2] as col (col)}
      <circle cx={18.5 + col * 3.4} cy={10 + row * 4.6} r="1.25" fill="#6e5b4d" />
    {/each}
  {/each}
</svg>
