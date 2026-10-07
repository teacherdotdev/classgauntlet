<script lang="ts">
  // The landing page's picture: a gauntlet raised before a heraldic shield,
  // with little parchment notes from a game in progress floating around it.
  import Avatar from './Avatar.svelte';
  import Gauntlet from './Gauntlet.svelte';
</script>

<div class="art" aria-hidden="true">
  <svg class="shield" viewBox="0 0 300 340">
    <defs>
      <pattern id="diaper" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="28" height="28" fill="#b23f2c" />
        <path d="M0 14 H28 M14 0 V28" stroke="#9c3424" stroke-width="2" />
      </pattern>
    </defs>
    <path d="M18 18 H282 V150 Q282 270 150 326 Q18 270 18 150 Z" fill="#7a5a1c" />
    <path d="M28 26 H272 V150 Q272 260 150 312 Q28 260 28 150 Z" fill="#d9a93a" />
    <path d="M42 40 H258 V150 Q258 250 150 296 Q42 250 42 150 Z" fill="url(#diaper)" stroke="#332a24" stroke-width="4" />
    <path d="M150 40 V296" stroke="#d9a93a" stroke-width="10" opacity="0.9" />
    <path d="M42 140 H258" stroke="#d9a93a" stroke-width="10" opacity="0.9" />
  </svg>

  <div class="glove"><Gauntlet size={300} tilt={-8} /></div>

  <span class="spark s1">✦</span>
  <span class="spark s2">✦</span>
  <span class="spark s3">✧</span>

  <div class="note n1"><Avatar name="Maya" size={28} /> <span><b>Maya</b> takes up the gauntlet!</span></div>
  <div class="note n2"><b class="coin"></b> <span>Prize Pot <b>+60</b></span></div>
  <div class="note n3"><Avatar name="Jordan" size={28} /> <span><b>Jordan</b> falls to the Comeback Crew</span></div>
</div>

<style>
  .art {
    position: relative;
    width: min(100%, 30rem);
    aspect-ratio: 1 / 1.02;
  }
  .shield {
    position: absolute;
    inset: 4% 10% 6%;
    width: 80%;
    height: 90%;
    filter: drop-shadow(0 18px 28px rgb(51 42 36 / 0.25));
  }
  .glove {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -48%);
    filter: drop-shadow(0 16px 18px rgb(20 14 10 / 0.45));
    animation: raise 4s ease-in-out infinite;
  }
  @keyframes raise {
    50% {
      transform: translate(-50%, -52%) rotate(-2deg);
    }
  }
  .spark {
    position: absolute;
    color: var(--or);
    font-size: 1.6rem;
    animation: twinkle 2.4s ease-in-out infinite;
  }
  .s1 {
    top: 2%;
    right: 12%;
  }
  .s2 {
    top: 30%;
    left: 0;
    animation-delay: 0.8s;
    font-size: 1.1rem;
  }
  .s3 {
    bottom: 12%;
    right: 2%;
    animation-delay: 1.5s;
  }
  @keyframes twinkle {
    50% {
      opacity: 0.25;
      transform: scale(0.7) rotate(20deg);
    }
  }
  .note {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 16rem;
    padding: 0.5rem 0.85rem 0.5rem 0.5rem;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 10px;
    box-shadow: 0 10px 24px rgb(51 42 36 / 0.18);
    font-size: 0.92rem;
    line-height: 1.25;
    color: var(--ink);
  }
  .n1 {
    top: 8%;
    left: -6%;
    transform: rotate(-4deg);
  }
  .n2 {
    top: 46%;
    right: -6%;
    transform: rotate(3deg);
    padding-left: 0.75rem;
  }
  .n3 {
    bottom: 2%;
    left: 0;
    transform: rotate(-2deg);
    background: var(--good-wash);
    border-color: var(--good-line);
  }
  .coin {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fbe7a3, #d9a93a 60%, #a87d17);
  }
  @media (prefers-reduced-motion: reduce) {
    .glove,
    .spark {
      animation: none;
    }
  }
</style>
