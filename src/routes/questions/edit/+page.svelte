<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import Brand from '#lib/components/Brand.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import { randomId } from '#lib/game/engine.ts';
  import type { Question, QuestionSet } from '#lib/game/types.ts';
  import { sampleSetId } from '#lib/questions/sample.ts';
  import { library } from '#lib/questions/store.svelte.ts';
  import { plural } from '#lib/words.ts';

  const blankQuestion = (): Question => ({ id: randomId(), prompt: '', choices: ['', '', ''], correct: 0, explanation: '' });

  function startingDraft(): QuestionSet {
    const id = page.url.searchParams.get('id');
    const existing = id ? library.get(id) : undefined;
    if (existing) return structuredClone($state.snapshot(existing)) as QuestionSet;
    return { id: randomId(), title: '', subject: '', grade: '', questions: [blankQuestion()], updatedAt: 0 };
  }

  const initial = startingDraft();
  let draft = $state(initial);
  let savedJson = $state(library.get(initial.id) ? JSON.stringify(initial) : '');
  const dirty = $derived(JSON.stringify(draft) !== savedJson);
  let problems = $state<string[]>([]);
  let justSaved = $state(false);
  const isSample = $derived(draft.id === sampleSetId);

  function problemsIn(set: QuestionSet): string[] {
    const list: string[] = [];
    if (!set.title.trim()) list.push('Give the set a title.');
    if (set.questions.length === 0) list.push('Add at least one question.');
    set.questions.forEach((q, i) => {
      const n = i + 1;
      if (!q.prompt.trim()) list.push(`Question ${n} has no question text.`);
      if (q.choices.some((c) => !c.trim())) list.push(`Question ${n} has a blank answer choice.`);
      else if (new Set(q.choices.map((c) => c.trim().toLowerCase())).size !== q.choices.length)
        list.push(`Question ${n} has two identical choices.`);
    });
    return list;
  }

  function save(): boolean {
    problems = problemsIn(draft);
    if (problems.length) return false;
    const clean: QuestionSet = {
      ...draft,
      title: draft.title.trim(),
      subject: draft.subject?.trim() || undefined,
      grade: draft.grade?.trim() || undefined,
      questions: draft.questions.map((q) => ({
        ...q,
        prompt: q.prompt.trim(),
        choices: q.choices.map((c) => c.trim()),
        explanation: q.explanation?.trim() || undefined,
      })),
    };
    library.save(clean);
    draft = clean;
    savedJson = JSON.stringify(draft);
    justSaved = true;
    setTimeout(() => (justSaved = false), 1500);
    if (page.url.searchParams.has('new')) history.replaceState(history.state, '', `/questions/edit?id=${draft.id}`);
    return true;
  }

  function play() {
    if (dirty && !save()) return;
    try {
      const prefs = JSON.parse(localStorage.getItem('classgauntlet:prefs') ?? '{}');
      localStorage.setItem('classgauntlet:prefs', JSON.stringify({ ...prefs, setId: draft.id }));
    } catch {
      /* fine */
    }
    goto('/host');
  }

  beforeNavigate((navigation) => {
    if (dirty && !confirm('You have unsaved changes. Leave without saving?')) navigation.cancel();
  });

  function move(i: number, by: number) {
    const j = i + by;
    if (j < 0 || j >= draft.questions.length) return;
    [draft.questions[i], draft.questions[j]] = [draft.questions[j], draft.questions[i]];
  }

  function removeChoice(q: Question, c: number) {
    q.choices.splice(c, 1);
    if (q.correct === c) q.correct = 0;
    else if (q.correct > c) q.correct--;
  }

  function addQuestion() {
    draft.questions.push(blankQuestion());
    requestAnimationFrame(() => {
      const fields = document.querySelectorAll<HTMLTextAreaElement>('.prompt');
      fields[fields.length - 1]?.focus();
    });
  }
</script>

<svelte:window onbeforeunload={(e) => dirty && e.preventDefault()} />
<svelte:head><title>{draft.title || 'New question set'} · Class Gauntlet</title></svelte:head>

<main class="page">
  <header class="top">
    <Brand />
    <a class="btn-quiet" href="/questions">← All sets</a>
  </header>

  <section class="panel meta">
    <label class="field title">Set title
      <input bind:value={draft.title} placeholder="e.g. Unit 3 Review: Ecosystems" />
    </label>
    <label class="field">Subject <input bind:value={draft.subject} placeholder="Optional" /></label>
    <label class="field">Grade <input bind:value={draft.grade} placeholder="Optional" /></label>
  </section>
  {#if isSample}
    <p class="hint">This is the sample set. Your edits are saved here; you can bring the original back from the question sets page after deleting it.</p>
  {/if}

  <ol class="questions">
    {#each draft.questions as q, i (q.id)}
      <li class="panel question">
        <div class="q-head">
          <span class="label">Question {i + 1}</span>
          <div class="tools">
            <button class="icon" onclick={() => move(i, -1)} disabled={i === 0} aria-label="Move question {i + 1} up">↑</button>
            <button class="icon" onclick={() => move(i, 1)} disabled={i === draft.questions.length - 1} aria-label="Move question {i + 1} down">↓</button>
            <button class="icon danger" onclick={() => draft.questions.splice(i, 1)} aria-label="Delete question {i + 1}">✕</button>
          </div>
        </div>
        <textarea class="prompt" bind:value={q.prompt} rows="2" placeholder="Type the question"></textarea>
        <fieldset class="choices">
          <legend class="sr-only">Answer choices for question {i + 1}; select the correct one</legend>
          {#each q.choices as _, c (c)}
            <div class="choice" class:right={q.correct === c}>
              <label class="correct" title="Mark {String.fromCharCode(65 + c)} as the right answer">
                <input type="radio" name="correct-{q.id}" value={c} bind:group={q.correct} />
                <span class="tile">{String.fromCharCode(65 + c)}</span>
              </label>
              <input class="text" bind:value={q.choices[c]} placeholder="Answer {String.fromCharCode(65 + c)}" aria-label="Answer {String.fromCharCode(65 + c)}" />
              {#if q.choices.length > 2}
                <button class="icon" onclick={() => removeChoice(q, c)} aria-label="Remove answer {String.fromCharCode(65 + c)}">✕</button>
              {/if}
            </div>
          {/each}
          <div class="choice-foot">
            <span class="hint">Tap a letter to mark the right answer{q.choices[q.correct] ? `: ${String.fromCharCode(65 + q.correct)}` : ''}.</span>
            {#if q.choices.length < 4}
              <button class="btn-quiet" onclick={() => q.choices.push('')}>+ Add answer {String.fromCharCode(65 + q.choices.length)}</button>
            {/if}
          </div>
        </fieldset>
        <label class="field explain">Why it’s right <small>(optional, shown after the reveal)</small>
          <input bind:value={q.explanation} placeholder="A short explanation" />
        </label>
      </li>
    {/each}
  </ol>

  <button class="add" onclick={addQuestion}>+ Add a question</button>

  {#if problems.length}
    <section class="panel problems" role="alert">
      <strong>Fix these before saving:</strong>
      <ul>{#each problems as problem, i (i)}<li>{problem}</li>{/each}</ul>
    </section>
  {/if}
</main>

<div class="savebar">
  <span class="hint">{plural(draft.questions.length, 'question')}</span>
  <div class="row">
    <button class="btn-save" class:pending={dirty} onclick={save} disabled={!dirty && !!savedJson}>
      {justSaved ? 'Saved ✓' : dirty ? 'Save changes' : 'Saved'}
    </button>
    <button class="btn-primary" onclick={play}>Play this set</button>
  </div>
</div>
<Footer />

<style>
  .page {
    max-width: 52rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 1rem;
    display: grid;
    gap: 1rem;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .meta {
    display: grid;
    grid-template-columns: 2fr 1fr 0.6fr;
    gap: 0.75rem;
  }
  .title input {
    font-family: var(--serif);
    font-size: 1.25rem;
    font-weight: 600;
  }
  .hint {
    color: var(--muted);
    font-size: 0.88rem;
  }
  .questions {
    list-style: none;
    display: grid;
    gap: 0.9rem;
  }
  .question {
    display: grid;
    gap: 0.7rem;
    border-radius: 14px;
  }
  .q-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tools {
    display: flex;
    gap: 0.3rem;
  }
  .icon {
    width: 2rem;
    height: 2rem;
    display: grid;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }
  .icon:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--paper);
  }
  .icon.danger:hover {
    border-color: var(--bad);
    color: var(--bad);
  }
  .icon:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .prompt {
    width: 100%;
    font-family: var(--serif);
    font-size: 1.15rem;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background: #fff;
    resize: vertical;
  }
  .prompt:focus {
    outline: 2px solid var(--accent);
    border-color: var(--accent);
  }
  .choices {
    border: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.45rem;
  }
  .choice {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.5rem;
    align-items: center;
  }
  .correct input {
    position: absolute;
    opacity: 0;
  }
  .tile {
    display: grid;
    place-items: center;
    width: 2.3rem;
    height: 2.3rem;
    border-radius: 9px;
    border: 1.5px solid var(--line-strong);
    background: var(--paper);
    font-family: var(--serif);
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-tile);
    color: var(--muted);
  }
  .correct:focus-within .tile {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
  .right .tile {
    background: var(--good-wash);
    border-color: var(--good);
    color: var(--good);
  }
  .right input.text {
    border-color: var(--good-line);
    background: #fbfdfa;
  }
  .choice-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .add {
    padding: 1rem;
    border: 2px dashed var(--line-strong);
    border-radius: 14px;
    background: var(--paper-low);
    font-family: var(--serif);
    font-size: 1.1rem;
    color: var(--ink-soft);
    cursor: pointer;
  }
  .add:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .problems {
    border-color: var(--bad-line);
    background: var(--bad-wash);
    color: var(--bad);
  }
  .problems ul {
    padding-left: 1.2rem;
    margin-top: 0.3rem;
  }
  .savebar {
    position: sticky;
    bottom: 0;
    z-index: 4;
    max-width: 52rem;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.25rem;
    background: rgb(238 230 218 / 0.92);
    backdrop-filter: blur(6px);
    border-top: 1px solid var(--line);
  }
  .row {
    display: flex;
    gap: 0.5rem;
  }
  .btn-save {
    padding: 0.6rem 1.15rem;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    background: var(--paper);
    color: var(--muted);
    border: 1px solid var(--line);
  }
  .btn-save.pending {
    background: var(--amber);
    border-color: var(--amber-border);
    color: #6b4a00;
  }
  .btn-save.pending:hover {
    background: var(--amber-strong);
  }
  .btn-save:disabled {
    cursor: default;
  }
  @media (max-width: 40rem) {
    .meta {
      grid-template-columns: 1fr 1fr;
    }
    .title {
      grid-column: 1 / -1;
    }
  }
</style>
