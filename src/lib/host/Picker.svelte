<script lang="ts">
  // Before a game: pick a question set and go. (The rules live behind the
  // gear in the lobby.)
  import Brand from '../components/Brand.svelte';
  import { DEFAULT_SETTINGS, type Settings } from '../game/types';
  import { forgetSavedGame, host, savedGame } from '../host.svelte';
  import { library } from '../questions/store.svelte';
  import { plural } from '../words';

  let saved = $state.raw(savedGame());
  const resumable = $derived(saved && saved.session.phase !== 'ENDED' ? saved : null);

  function prefs(): Partial<Settings> & { setId?: string } {
    try {
      return JSON.parse(localStorage.getItem('classgauntlet:prefs') ?? '{}');
    } catch {
      return {};
    }
  }

  function hostSet(id: string) {
    const set = library.get(id);
    if (!set || set.questions.length === 0) return;
    const { setId: _, ...settings } = prefs();
    try {
      localStorage.setItem('classgauntlet:prefs', JSON.stringify({ ...prefs(), setId: id }));
    } catch {
      /* fine */
    }
    host.create({ setTitle: set.title, questions: $state.snapshot(set.questions), settings: { ...DEFAULT_SETTINGS, ...settings } });
  }

  const last = prefs().setId;
  const sets = $derived([...library.sorted].sort((a, b) => Number(b.id === last) - Number(a.id === last)));
</script>

<main class="picker">
  <header>
    <Brand />
    <a class="btn-quiet" href="/questions">Question sets</a>
  </header>

  {#if resumable}
    <section class="resume">
      <div>
        <strong>Game {resumable.session.code} is still going</strong>
        <span>{resumable.session.setTitle} · {plural(resumable.session.players.length, 'player')}</span>
      </div>
      <button class="btn-primary" onclick={() => host.resume(resumable)}>Resume</button>
      <button class="btn-quiet" onclick={() => { forgetSavedGame(); saved = null; }}>Discard</button>
    </section>
  {/if}

  <h1>Choose your questions</h1>
  <ul class="sets">
    {#each sets as set (set.id)}
      <li>
        <button class="set" onclick={() => hostSet(set.id)} disabled={set.questions.length === 0}>
          <span class="title">{set.title}</span>
          <span class="meta">{plural(set.questions.length, 'question')}{set.subject ? ` · ${set.subject}` : ''}{set.grade ? ` · Grade ${set.grade}` : ''}</span>
          <span class="go">Host <span aria-hidden="true">▸</span></span>
        </button>
      </li>
    {/each}
    <li><a class="set new" href="/questions/edit?new=1"><span class="title">+ Write a new set</span><span class="meta">Or import one from a spreadsheet</span></a></li>
  </ul>
</main>

<style>
  .picker {
    max-width: 52rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem;
    display: grid;
    gap: 1.25rem;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h1 {
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(2.4rem, 5vw, 3.4rem);
    margin-top: 1rem;
  }
  .resume {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.1rem;
    border-radius: 12px;
    background: #fff6dc;
    border: 1px solid var(--amber-border);
  }
  .resume div {
    flex: 1;
    display: grid;
  }
  .resume span {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .sets {
    list-style: none;
    display: grid;
    gap: 0.6rem;
  }
  .set {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.15rem 1rem;
    align-items: center;
    padding: 1rem 1.25rem;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    box-shadow: var(--shadow-rest);
    transition:
      transform 0.15s,
      box-shadow 0.15s;
  }
  .set:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-lift);
  }
  .title {
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.2rem;
  }
  .meta {
    grid-column: 1;
    color: var(--muted);
    font-size: 0.9rem;
  }
  .go {
    grid-row: 1 / span 2;
    grid-column: 2;
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    background: var(--accent);
    color: var(--paper);
    font-weight: 700;
  }
  .new {
    border: 2px dashed var(--line-strong);
    background: var(--paper-low);
    box-shadow: none;
  }
</style>
