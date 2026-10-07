<script lang="ts">
  import { goto } from '$app/navigation';
  import Brand from '#lib/components/Brand.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import { cleanRoomCode } from '#lib/protocol.ts';

  let code = $state('');
  function join(event: SubmitEvent) {
    event.preventDefault();
    const clean = cleanRoomCode(code);
    goto(clean ? `/join?code=${clean}` : '/join');
  }
</script>

<svelte:head><title>1 vs 100 Classroom · A review game where nobody gets knocked out</title></svelte:head>

<main class="page">
  <header class="top">
    <Brand />
    <a class="btn-quiet" href="/questions">Question sets</a>
  </header>

  <section class="hero">
    <div>
      <p class="label">A classroom review game</p>
      <h1>One student takes on the rest of the class, and nobody gets knocked out.</h1>
      <p class="lede">
        A miss doesn’t send anyone to the sidelines. It just moves them to the Comeback Crew, so every student is still
        answering, still scoring and still learning on the last question.
      </p>
    </div>
  </section>

  <section class="doors">
    <article class="panel door">
      <p class="label">Teachers</p>
      <h2>Run a game</h2>
      <p>Pick or write a question set, open a room, and put the code on the projector. Your browser runs the game; no account or install.</p>
      <div class="actions">
        <a class="btn-primary big" href="/host">Start a game</a>
        <a class="btn-ghost" href="/questions">Write questions</a>
      </div>
    </article>
    <article class="panel door">
      <p class="label">Students</p>
      <h2>Join a game</h2>
      <form onsubmit={join}>
        <label class="field">
          Code from the board
          <input
            class="code-input"
            bind:value={code}
            oninput={() => (code = cleanRoomCode(code))}
            maxlength="6"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            placeholder="ABC234"
          />
        </label>
        <button class="btn-primary big" type="submit">Join</button>
      </form>
    </article>
  </section>

  <section class="how panel">
    <h2>How a game works</h2>
    <ol>
      <li><strong>The teacher picks The One.</strong> One student steps into the Spotlight; everyone else is the Challenge Team.</li>
      <li><strong>Everybody answers first.</strong> The question appears on every device except The One’s. The big screen only shows how many have answered.</li>
      <li><strong>Then the Spotlight Round.</strong> The One sees the question and answers alone, or uses one of three lifelines: Poll the Class, Ask Two, or Go with the Class.</li>
      <li><strong>The Reveal.</strong> If The One is right, classmates who missed join the Comeback Crew (still playing, still scoring) and the Prize Pot grows. If The One is wrong, they lose a chance.</li>
      <li><strong>The game ends</strong> when The One runs out of chances (the Challenge Team splits the pot), clears every question (The One banks it), or empties the Challenge Team (jackpot!). Then someone new takes the Spotlight.</li>
    </ol>
  </section>
</main>
<Footer />

<style>
  .page {
    max-width: 68rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 1rem;
    display: grid;
    gap: 1.75rem;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .hero h1 {
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    max-width: 46rem;
    margin: 0.4rem 0 0.75rem;
  }
  .hero .lede {
    max-width: 44rem;
    font-size: 1.05rem;
  }
  .doors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
    gap: 1.1rem;
  }
  .door {
    display: grid;
    gap: 0.75rem;
    align-content: start;
    border-radius: 14px;
    padding: 1.5rem;
  }
  .door h2 {
    font-size: 1.6rem;
  }
  .door p:not(.label) {
    color: var(--ink-soft);
  }
  .actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    align-items: center;
  }
  form {
    display: flex;
    gap: 0.6rem;
    align-items: end;
    flex-wrap: wrap;
  }
  form .field {
    flex: 1 1 10rem;
  }
  .code-input {
    font-family: var(--serif) !important;
    font-size: 1.6rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.25em;
    text-transform: uppercase;
  }
  .how {
    border-radius: 14px;
    padding: 1.5rem;
  }
  .how h2 {
    font-size: 1.3rem;
    margin-bottom: 0.75rem;
  }
  .how ol {
    padding-left: 1.25rem;
    display: grid;
    gap: 0.6rem;
    font-family: var(--serif);
    line-height: 1.55;
  }
  .how li::marker {
    color: var(--accent);
    font-weight: 700;
  }
</style>
