<script lang="ts">
  import ProsePage from '#lib/components/ProsePage.svelte';
  import { supportEmail, supportMailto } from '#lib/support.ts';
</script>

<svelte:head><title>Privacy · Class Gauntlet</title></svelte:head>

<ProsePage eyebrow="Privacy" title="Privacy" lede="What we collect, what we don’t, and why.">
  <section class="card">
    <h2>The game runs on your computer</h2>
    <p>
      Class Gauntlet has no accounts and no sign-in. When you host a game, your browser runs it: the questions, the players’
      nicknames and their points live in your browser on your own computer, and are never uploaded to us or to anyone else.
      Your question sets are kept there too. A share link carries a question set inside the link itself, after the #, which
      browsers never send to a website.
    </p>
    <p>
      Students join with a nickname, nothing more. We suggest first names or made-up names, whatever your school prefers.
    </p>
  </section>

  <section class="card">
    <h2>How phones reach your computer</h2>
    <p>
      Each student’s phone talks directly to your computer over an encrypted connection. To find each other, they are
      introduced by a small matchmaking server run by teacher.dev. It sees only a random address for each device, stores
      nothing, and never receives the game.
    </p>
    <p>
      Some school networks block devices from talking directly. Then the encrypted data is passed along by a relay run by
      <a href="https://developers.cloudflare.com/realtime/turn/" target="_blank" rel="noopener noreferrer">Cloudflare</a>,
      which can’t read it. Google’s public connection service helps each device learn its own network address; it sees no
      game data.
    </p>
    <p>
      A student’s phone remembers which game it joined, so a reload puts them back in. That memory is cleared when the game
      ends.
    </p>
  </section>

  <section class="card">
    <h2>No tracking</h2>
    <p>
      Class Gauntlet doesn’t use cookies or ads, and we don’t share, sell or otherwise transfer any visitor data. To see how
      many people visit, we use
      <a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noopener noreferrer">Cloudflare Web Analytics</a>,
      which counts page views without cookies or anything that identifies you, and never sees your game. Our fonts are served
      from this site, not from a font service.
    </p>
    <p>Questions or concerns? Email <a href={supportMailto('privacy')}>{supportEmail}</a>.</p>
  </section>
</ProsePage>
