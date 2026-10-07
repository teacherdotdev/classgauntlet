<script lang="ts">
  // A small symmetric pixel face made from the nickname, so a student can spot
  // themselves on the projector. Same idea as the original game's avatars, in
  // this palette.
  let { name, size = 32 }: { name: string; size?: number } = $props();

  const palettes = [
    ['#b9cde4', '#3f5a7c', '#fffaf3'],
    ['#e2cd97', '#7a5a1c', '#fffaf3'],
    ['#dcc2d4', '#6f4262', '#fffaf3'],
    ['#b5d2c4', '#2f6150', '#fffaf3'],
    ['#ecd0bb', '#9f5037', '#fffaf3'],
  ];

  const art = $derived.by(() => {
    let state = 2166136261;
    for (const c of name.trim().toLowerCase()) {
      state ^= c.charCodeAt(0);
      state = Math.imul(state, 16777619);
    }
    state = state >>> 0 || 1;
    const colour = state % palettes.length;
    const random = () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
    const palette = palettes[colour];
    const pixels: [number, number][] = [];
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 3; col++)
        if (random() > 0.5) {
          pixels.push([8 + col * 6, 9 + row * 6]);
          if (col < 2) pixels.push([32 - col * 6, 9 + row * 6]);
        }
    return { palette, pixels };
  });
</script>

<svg class="avatar" viewBox="0 0 46 46" width={size} height={size} aria-hidden="true">
  <rect width="46" height="46" rx="10" fill={art.palette[1]} />
  <rect x="5" y="5" width="36" height="36" rx="6" fill={art.palette[0]} />
  {#each art.pixels as [x, y], i (i)}
    <rect {x} {y} width="6" height="6" fill={art.palette[2]} opacity="0.85" />
  {/each}
  <rect x="14" y="19" width="5" height="5" fill={art.palette[1]} />
  <rect x="27" y="19" width="5" height="5" fill={art.palette[1]} />
  <rect x="17" y="31" width="12" height="3" fill={art.palette[1]} />
</svg>

<style>
  .avatar {
    flex: none;
    display: block;
  }
</style>
