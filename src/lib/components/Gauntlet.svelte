<script lang="ts">
  // A plate-armour gauntlet raised in challenge: arched finger plates that taper
  // to the tips, a back-of-hand plate that narrows to the wrist, and a flared,
  // riveted cuff. Flat shapes with a warm ink outline, like the rest of the paper look.
  let { size = 320, tilt = -10 }: { size?: number; tilt?: number } = $props();

  const ink = '#332a24';
  const line = 5;

  // Finger centre x, tip y and base width (left to right: index → little).
  const fingers = [
    { cx: 150, tip: 70, w: 30 },
    { cx: 184, tip: 44, w: 31 },
    { cx: 218, tip: 56, w: 30 },
    { cx: 250, tip: 92, w: 27 },
  ];
  const base = 178;

  /** One arched plate: its top edge bows upward, like a scale. */
  function plate(cx: number, y: number, w: number, h: number) {
    const x = cx - w / 2;
    return `M${x} ${y + 7} Q${cx} ${y - 7} ${x + w} ${y + 7} L${x + w} ${y + h} L${x} ${y + h} Z`;
  }

  function fingerPlates(f: { cx: number; tip: number; w: number }) {
    const n = 4;
    const step = (base - f.tip) / n;
    return Array.from({ length: n }, (_, i) => ({
      d:
        i === 0
          ? // The tip: a rounded dome.
            `M${f.cx - (f.w - 6) / 2} ${f.tip + step + 4} V${f.tip + 12} Q${f.cx - (f.w - 6) / 2} ${f.tip} ${f.cx} ${f.tip} Q${f.cx + (f.w - 6) / 2} ${f.tip} ${f.cx + (f.w - 6) / 2} ${f.tip + 12} V${f.tip + step + 4} Z`
          : plate(f.cx, f.tip + step * i, f.w - 6 + i * 2, step + 6),
      fill: i % 2 ? 'url(#g-steel-dark)' : 'url(#g-steel)',
    }));
  }
</script>

<svg viewBox="0 0 400 440" width={size} height={size * 1.1} role="img" aria-label="A knight's gauntlet, raised in challenge">
  <defs>
    <linearGradient id="g-steel" x1="0" x2="1">
      <stop offset="0" stop-color="#8f949c" />
      <stop offset="0.42" stop-color="#e3e5e8" />
      <stop offset="1" stop-color="#868b93" />
    </linearGradient>
    <linearGradient id="g-steel-dark" x1="0" x2="1">
      <stop offset="0" stop-color="#737881" />
      <stop offset="0.5" stop-color="#bfc3c8" />
      <stop offset="1" stop-color="#6a6f77" />
    </linearGradient>
    <linearGradient id="g-cuff" x1="0" x2="1">
      <stop offset="0" stop-color="#83888f" />
      <stop offset="0.35" stop-color="#dfe2e5" />
      <stop offset="0.6" stop-color="#b9bdc3" />
      <stop offset="1" stop-color="#7a7f87" />
    </linearGradient>
  </defs>

  <g transform="rotate({tilt} 200 260)" stroke={ink} stroke-width={line} stroke-linejoin="round" stroke-linecap="round">
    <!-- Thumb: plates fanning up and out from under the side of the hand -->
    <g transform="rotate(-24 150 262)">
      <path d={plate(132, 246, 46, 50)} fill="url(#g-steel)" />
      <path d={plate(132, 212, 42, 42)} fill="url(#g-steel-dark)" />
      <path d="M115 220 V194 Q115 178 132 178 Q149 178 149 194 V220 Z" fill="url(#g-steel)" />
    </g>

    <!-- Fingers -->
    {#each fingers as f, i (i)}
      {#each fingerPlates(f) as p, j (j)}
        <path d={p.d} fill={p.fill} />
      {/each}
    {/each}

    <!-- Back of the hand: wide over the knuckles, narrowing to the wrist -->
    <path d="M128 182 Q200 160 274 182 L260 268 Q256 300 238 304 H162 Q144 300 140 268 Z" fill="url(#g-steel)" />
    <!-- Knuckle guard with rivets -->
    <path d="M126 184 Q200 162 276 184 L272 208 Q200 188 130 208 Z" fill="url(#g-steel-dark)" />
    {#each [150, 184, 218, 250] as x, i (i)}
      <circle cx={x} cy={i === 0 || i === 3 ? 194 : 186} r="4.5" fill="#f0d27c" stroke-width="2.5" />
    {/each}
    <!-- Overlapping hand lames -->
    <path d="M136 236 Q200 222 266 236" fill="none" stroke-width="4" />
    <path d="M142 266 Q200 254 260 266" fill="none" stroke-width="4" />

    <!-- Wrist band -->
    <path d="M150 296 H250 Q260 296 260 306 V318 Q260 328 250 328 H150 Q140 328 140 318 V306 Q140 296 150 296 Z" fill="#9f5037" />
    {#each [160, 180, 200, 220, 240] as x (x)}
      <circle cx={x} cy={312} r="4" fill="#f0d27c" stroke-width="2.5" />
    {/each}

    <!-- Flared cuff with a scalloped hem -->
    <path
      d="M146 328 H254 Q276 360 300 404 Q302 414 292 416 Q275 408 258 418 Q240 408 222 418 Q204 408 186 418 Q168 408 150 418 Q132 408 116 416 Q98 414 100 404 Q124 360 146 328 Z"
      fill="url(#g-cuff)"
    />
    <path d="M128 372 Q200 388 272 372" fill="none" stroke-width="4" />

    <!-- Shine -->
    <g stroke="#fff" stroke-width="6" opacity="0.6" fill="none">
      <path d="M236 214 Q244 246 238 280" />
      <path d="M262 344 Q276 372 282 398" />
      <path d="M190 64 V96" stroke-width="5" />
    </g>
  </g>
</svg>
