<script lang="ts">
  import { onDestroy } from 'svelte';
  import Avatar from '#lib/components/Avatar.svelte';
  import Brand from '#lib/components/Brand.svelte';
  import Choice from '#lib/components/Choice.svelte';
  import Countdown from '#lib/components/Countdown.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import Hearts from '#lib/components/Hearts.svelte';
  import Projector from '#lib/components/Projector.svelte';
  import QrCode from '#lib/components/QrCode.svelte';
  import { DEFAULT_SETTINGS, type Settings } from '#lib/game/types.ts';
  import { forgetSavedGame, host, savedGame } from '#lib/host.svelte.ts';
  import { library } from '#lib/questions/store.svelte.ts';
  import { endHeadline, helpName, phaseName, plural, roleName } from '#lib/words.ts';

  // ── Setup ──────────────────────────────────────────────────────────────
  const prefsKey = 'classgauntlet:prefs';
  function loadPrefs(): Partial<Settings> & { setId?: string } {
    try {
      return JSON.parse(localStorage.getItem(prefsKey) ?? '{}');
    } catch {
      return {};
    }
  }
  const prefs = loadPrefs();
  let saved = $state.raw(savedGame());
  const resumable = $derived(saved && saved.session.phase !== 'ENDED' ? saved : null);
  let setId = $state(prefs.setId && library.get(prefs.setId) ? prefs.setId : (library.sorted[0]?.id ?? ''));
  let timerSeconds = $state(prefs.timerSeconds ?? DEFAULT_SETTINGS.timerSeconds);
  let strikes = $state(prefs.strikes ?? DEFAULT_SETTINGS.strikes);
  let questionsPerGame = $state(prefs.questionsPerGame ?? DEFAULT_SETTINGS.questionsPerGame);
  let momentumEnabled = $state(prefs.momentumEnabled ?? DEFAULT_SETTINGS.momentumEnabled);
  let shuffleQuestions = $state(prefs.shuffleQuestions ?? DEFAULT_SETTINGS.shuffleQuestions);
  const chosenSet = $derived(library.get(setId));

  function openRoom() {
    const set = chosenSet;
    if (!set || set.questions.length === 0) return;
    const settings = { timerSeconds, strikes, questionsPerGame, momentumEnabled, shuffleQuestions };
    try {
      localStorage.setItem(prefsKey, JSON.stringify({ ...settings, setId }));
    } catch {
      /* fine */
    }
    host.create({ setTitle: set.title, questions: $state.snapshot(set.questions), settings });
  }

  function resume() {
    if (resumable) host.resume(resumable);
  }

  function discard() {
    forgetSavedGame();
    saved = null;
  }

  function newGame() {
    host.close();
    forgetSavedGame();
    saved = null;
  }

  onDestroy(() => host.close());

  // Closing this tab ends the game for everyone, so ask first.
  function beforeUnload(event: BeforeUnloadEvent) {
    if (host.session && host.session.phase !== 'ENDED' && host.session.players.length > 0) event.preventDefault();
  }

  // ── Live game ──────────────────────────────────────────────────────────
  const s = $derived(host.session);
  const view = $derived(host.view);
  const game = $derived(s?.game ?? null);
  const active = $derived(game?.active ?? null);
  const one = $derived(game ? s?.players.find((p) => p.id === game.oneId) : undefined);
  const oneName = $derived(one?.nickname ?? 'The One');
  const deadline = $derived(view?.question?.remainingMs != null ? Date.now() + view.question.remainingMs : null);
  const nextQuestion = $derived(s && game && !game.result ? s.questions[game.deck[game.offset]] : undefined);
  const players = $derived(
    s ? [...s.players].sort((a, b) => b.points - a.points || a.joinedAt - b.joinedAt) : [],
  );
  let nextOne = $state('');
  let copied = $state(false);
  let confirmEnd = $state(false);
  let showProjector = $state(true);

  $effect(() => {
    // Keep the "who's next" picker in step with the game's suggestion.
    if (s?.phase === 'LOBBY' || s?.phase === 'LEADERBOARD') {
      if (!nextOne || !s.players.some((p) => p.id === nextOne)) nextOne = s.pendingNextOneId ?? '';
    }
  });

  function counts(): number[] {
    if (!active) return [];
    return active.question.choices.map((_, i) => active.answers.filter((a) => a.choice === i).length);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(host.joinUrl);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  function openProjector() {
    window.open('/show', 'classgauntlet-projector', 'popup,width=1280,height=760');
  }

  function start() {
    const chosen = nextOne || undefined;
    host.run((engine) => engine.startGame(chosen));
  }

  function randomOne() {
    if (!s) return;
    const pool = s.players.filter((p) => p.connected && !p.hasBeenOne);
    const list = pool.length ? pool : s.players;
    nextOne = list[Math.floor(Math.random() * list.length)]?.id ?? '';
    host.run((engine) => engine.chooseNextOne(nextOne || null));
  }

  const statusText = $derived(
    {
      opening: 'Opening the room…',
      open: 'Room open',
      reclaiming: 'Reclaiming room code…',
      reconnecting: 'Reconnecting to matchmaking…',
      failed: 'Room closed',
      closed: 'Game over',
    }[host.status],
  );
</script>

<svelte:window onbeforeunload={beforeUnload} />

<svelte:head><title>{s ? `${s.code} · Teacher` : 'Start a game'} · Class Gauntlet</title></svelte:head>

{#if !s}
  <main class="page">
    <header class="top">
      <Brand />
      <a class="btn-quiet" href="/questions">Question sets</a>
    </header>

    <div>
      <p class="label">Teacher console</p>
      <h1>Start today’s game</h1>
      <p class="lede">Your browser runs the game. Keep this tab open on your computer while you play.</p>
    </div>

    {#if resumable}
      <section class="panel resume">
        <div>
          <h2>Pick up where you left off?</h2>
          <p class="lede">
            Room <strong>{resumable.session.code}</strong> · {resumable.session.setTitle} ·
            {plural(resumable.session.players.length, 'student')}
            {#if resumable.session.game} · Game {resumable.session.game.ordinal}{/if}
          </p>
        </div>
        <div class="row">
          <button class="btn-primary" onclick={resume}>Resume game</button>
          <button class="btn-ghost" onclick={discard}>Start fresh</button>
        </div>
      </section>
    {/if}

    <section class="setup">
      <div class="panel">
        <div class="section-head">
          <h2>Question set</h2>
          <a class="btn-quiet" href="/questions/edit?new=1">+ New set</a>
        </div>
        <div class="sets" role="radiogroup" aria-label="Question set">
          {#each library.sorted as set (set.id)}
            <label class="set" class:on={setId === set.id}>
              <input type="radio" name="set" value={set.id} bind:group={setId} />
              <strong>{set.title}</strong>
              <span>{plural(set.questions.length, 'question')}{set.subject ? ` · ${set.subject}` : ''}{set.grade ? ` · Grade ${set.grade}` : ''}</span>
              <a href="/questions/edit?id={set.id}" class="edit">Edit</a>
            </label>
          {:else}
            <p class="lede">No question sets yet. <a href="/questions/edit?new=1">Write one</a> or <a href="/questions">import a CSV</a>.</p>
          {/each}
        </div>
      </div>

      <div class="panel settings">
        <h2>Rules</h2>
        <label class="field">Time to answer (seconds)
          <input type="number" min="5" max="120" bind:value={timerSeconds} />
        </label>
        <label class="field">Chances for The One
          <input type="number" min="1" max="5" bind:value={strikes} />
          <small>Wrong answers The One can survive before the game ends.</small>
        </label>
        <label class="field">Questions per game
          <input type="number" min="1" max="50" bind:value={questionsPerGame} />
          <small>Each new Spotlight Player gets the next questions in the set.</small>
        </label>
        <label class="check"><input type="checkbox" bind:checked={shuffleQuestions} /> Shuffle the questions</label>
        <label class="check">
          <input type="checkbox" bind:checked={momentumEnabled} />
          <span><strong>On a Roll</strong> — fast, unaided right answers earn The One a chance back (once per game)</span>
        </label>
        <button class="btn-primary big" disabled={!chosenSet || chosenSet.questions.length === 0} onclick={openRoom}>
          Open the room
        </button>
      </div>
    </section>
  </main>
  <Footer />
{:else}
  <main class="cockpit">
    <header class="cockpit-top">
      <Brand size={26} href={null} />
      <div class="room">
        <span class="label">Room code</span>
        <strong class="code">{s.code}</strong>
        <span class="pill" class:good={host.status === 'open'} class:bad={host.status === 'failed'}>{statusText}</span>
      </div>
      <div class="row">
        <button class="btn-ghost" onclick={copyLink}>{copied ? 'Copied!' : 'Copy join link'}</button>
        <button class="btn-primary" onclick={openProjector}>Open projector window</button>
      </div>
    </header>
    {#if host.problem}<p class="problem" role="alert">{host.problem}</p>{/if}

    <div class="columns">
      <div class="controls">
        <section class="panel live">
          <div class="live-head">
            <div>
              <p class="label">{game ? `Game ${game.ordinal} · ` : ''}{phaseName[s.phase]}{s.paused ? ' · Paused' : ''}</p>
              <h2>
                {#if s.phase === 'LOBBY'}
                  {s.players.length === 0 ? 'Waiting for students to join' : `${plural(s.players.length, 'student')} in the room`}
                {:else if s.phase === 'BETWEEN'}
                  {oneName} is in the Spotlight
                {:else if s.phase === 'PHASE_A'}
                  {active?.answers.length} / {active?.eligible.length} answered
                {:else if s.phase === 'PHASE_A_LOCKED'}
                  Class answers locked
                {:else if s.phase === 'PHASE_B'}
                  {oneName} is answering
                {:else if s.phase === 'ONE_LOCKED'}
                  {oneName} chose {String.fromCharCode(65 + (active?.oneAnswer ?? 0))}
                {:else if s.phase === 'REVEAL'}
                  {game?.result ? endHeadline(game.result.reason, oneName, game.result.bankedByOne) : game?.reveal?.oneCorrect ? `${oneName} got it!` : `${oneName} missed`}
                {:else if s.phase === 'LEADERBOARD'}
                  Who’s next in the Spotlight?
                {:else}
                  Game over. Thanks for playing!
                {/if}
              </h2>
            </div>
            {#if s.phase === 'PHASE_A'}<Countdown {deadline} paused={s.paused} big />{/if}
          </div>

          {#if game && s.phase !== 'LEADERBOARD' && s.phase !== 'ENDED'}
            <div class="mini-board">
              <span>Prize Pot <strong>{game.bank}</strong></span>
              <span>Chances <Hearts left={game.strikes} total={s.settings.strikes} /></span>
              <span>Challenge Team <strong>{s.players.filter((p) => p.role === 'mob').length}</strong></span>
              <span>Question <strong>{Math.max(1, active?.index ?? game.offset)} / {game.deck.length}</strong></span>
            </div>
          {/if}

          <div class="primary">
            {#if s.phase === 'LOBBY' || s.phase === 'LEADERBOARD'}
              <label class="field one-pick">
                {s.phase === 'LOBBY' ? 'First Spotlight Player' : 'Next Spotlight Player'}
                <select bind:value={nextOne} onchange={() => host.run((engine) => engine.chooseNextOne(nextOne || null))}>
                  <option value="">Top scorer who hasn’t had a turn</option>
                  {#each players as p (p.id)}
                    <option value={p.id}>{p.nickname}{p.hasBeenOne ? ' (had a turn)' : ''}{p.connected ? '' : ' — offline'}</option>
                  {/each}
                </select>
              </label>
              <div class="row">
                <button class="btn-ghost" onclick={randomOne} disabled={s.players.length === 0}>Pick at random</button>
                <button class="btn-primary big" onclick={start} disabled={s.players.length < 2}>
                  {s.phase === 'LOBBY' ? 'Start the game' : 'Start next game'}
                </button>
              </div>
              {#if s.players.length < 2}<p class="hint">You need at least two students to play.</p>{/if}
            {:else if s.phase === 'BETWEEN'}
              <button class="btn-primary big" onclick={() => host.run((e) => e.openQuestion())}>Open question {game ? game.offset + 1 : 1}</button>
            {:else if s.phase === 'PHASE_A'}
              <button class="btn-primary big" onclick={() => host.run((e) => e.lock())}>Lock answers now</button>
            {:else if s.phase === 'PHASE_A_LOCKED'}
              <button class="btn-primary big" onclick={() => host.run((e) => e.showToOne())}>Show the question to {oneName}</button>
            {:else if s.phase === 'PHASE_B'}
              <p class="hint">
                {one?.connected ? `${oneName} sees the question and can use a lifeline.` : `${oneName}’s device is offline.`}
                If they answer out loud instead, enter it here:
              </p>
              <div class="row">
                {#each active?.question.choices ?? [] as _, i (i)}
                  <button class="btn-ghost" onclick={() => host.run((e) => e.answerForOne(i))}>{String.fromCharCode(65 + i)}</button>
                {/each}
              </div>
            {:else if s.phase === 'ONE_LOCKED'}
              <button class="btn-primary big" onclick={() => host.run((e) => e.reveal())}>Reveal the answer</button>
            {:else if s.phase === 'REVEAL'}
              <button class="btn-primary big" onclick={() => host.run((e) => e.next())}>
                {game?.result ? 'Show the leaderboard' : `Next question (${(game?.offset ?? 0) + 1} of ${game?.deck.length})`}
              </button>
            {:else if s.phase === 'ENDED'}
              <button class="btn-primary big" onclick={newGame}>Set up a new game</button>
            {/if}
          </div>

          {#if host.notice}<p class="problem" role="alert">{host.notice}</p>{/if}

          <div class="secondary row">
            {#if s.phase === 'PHASE_A' || s.phase === 'PHASE_B'}
              {#if s.paused}
                <button class="btn-ghost" onclick={() => host.run((e) => e.resume())}>Resume</button>
              {:else}
                <button class="btn-ghost" onclick={() => host.run((e) => e.pause())}>Pause</button>
              {/if}
            {/if}
            {#if game && !['LOBBY', 'LEADERBOARD', 'ENDED'].includes(s.phase)}
              <button class="btn-ghost" onclick={() => host.run((e) => e.endGame())}>End this game</button>
            {/if}
            {#if s.phase !== 'ENDED'}
              {#if confirmEnd}
                <span class="hint">End for everyone?</span>
                <button class="btn-danger" onclick={() => { confirmEnd = false; host.finish(); }}>End session</button>
                <button class="btn-quiet" onclick={() => (confirmEnd = false)}>Cancel</button>
              {:else}
                <button class="btn-quiet" onclick={() => (confirmEnd = true)}>End session…</button>
              {/if}
            {/if}
          </div>
        </section>

        {#if active && ['PHASE_A', 'PHASE_A_LOCKED', 'PHASE_B', 'ONE_LOCKED', 'REVEAL'].includes(s.phase)}
          <section class="panel key">
            <p class="label">Answer key · only on your screen</p>
            <h3>{active.question.prompt}</h3>
            <div class="key-choices">
              {#each active.question.choices as text, i (i)}
                <Choice index={i} {text} state={i === active.question.correct ? 'correct' : 'idle'} tally={counts()[i]} note={active.oneAnswer === i ? `${oneName}’s answer` : ''} />
              {/each}
            </div>
            {#if active.question.explanation}<p class="explain">{active.question.explanation}</p>{/if}
            {#if active.helpResult}
              <p class="hint">Lifeline used: {helpName[active.helpResult.type]}</p>
            {/if}
          </section>
        {:else if nextQuestion}
          <section class="panel key">
            <p class="label">Next up · only on your screen</p>
            <h3>{nextQuestion.prompt}</h3>
            <p class="hint">Answer: {String.fromCharCode(65 + nextQuestion.correct)}. {nextQuestion.choices[nextQuestion.correct]}</p>
          </section>
        {/if}

        <section class="panel roster">
          <div class="section-head">
            <h2>Class</h2>
            <span class="hint">{plural(s.players.filter((p) => p.connected).length, 'student')} online</span>
          </div>
          {#if players.length === 0}
            <p class="lede">Students join at <strong>{host.joinUrl.replace(/^https?:\/\//, '')}</strong></p>
          {/if}
          <ul>
            {#each players as p (p.id)}
              <li class:offline={!p.connected}>
                <Avatar name={p.nickname} size={28} />
                <span class="who">
                  <strong>{p.nickname}</strong>
                  <small>
                    <span class="dot" class:on={p.connected}></span>
                    {p.connected ? roleName[p.role] : 'Offline'}{p.hasBeenOne && p.role !== 'one' ? ' · had a turn' : ''}
                    {#if active && s.phase === 'PHASE_A' && active.eligible.includes(p.id)}
                      · {active.answers.some((a) => a.playerId === p.id) ? 'answered' : 'thinking'}
                    {/if}
                  </small>
                </span>
                <span class="pts">{p.points}</span>
                <button class="btn-quiet remove" onclick={() => host.kick(p.id)} title="Remove {p.nickname} from the game" aria-label="Remove {p.nickname}">✕</button>
              </li>
            {/each}
          </ul>
        </section>

        <details class="panel">
          <summary>Rules for the rest of this session</summary>
          <div class="settings-live">
            <label class="field">Time to answer (seconds)
              <input type="number" min="5" max="120" value={s.settings.timerSeconds} onchange={(e) => host.run((en) => en.updateSettings({ timerSeconds: Number(e.currentTarget.value) }))} />
              <small>Applies from the next question.</small>
            </label>
            <label class="field">Chances for The One
              <input type="number" min="1" max="5" value={s.settings.strikes} onchange={(e) => host.run((en) => en.updateSettings({ strikes: Number(e.currentTarget.value) }))} />
              <small>Applies from the next game.</small>
            </label>
            <label class="field">Questions per game
              <input type="number" min="1" max="50" value={s.settings.questionsPerGame} onchange={(e) => host.run((en) => en.updateSettings({ questionsPerGame: Number(e.currentTarget.value) }))} />
              <small>Applies from the next game.</small>
            </label>
            <label class="check">
              <input type="checkbox" checked={s.settings.momentumEnabled} onchange={(e) => host.run((en) => en.updateSettings({ momentumEnabled: e.currentTarget.checked }))} />
              On a Roll
            </label>
          </div>
        </details>
      </div>

      <aside class="preview">
        <div class="section-head">
          <p class="label">What the projector shows</p>
          <button class="btn-quiet" onclick={() => (showProjector = !showProjector)}>{showProjector ? 'Hide' : 'Show'}</button>
        </div>
        {#if showProjector && view}
          <div class="screen"><Projector {view} joinUrl={host.joinUrl} compact /></div>
        {/if}
        {#if s.phase === 'LOBBY'}
          <div class="panel qr-panel">
            <div class="qr"><QrCode text={host.joinUrl} label="QR code to join" /></div>
            <p>Students scan this, or go to <strong>{host.joinUrl.replace(/^https?:\/\//, '').replace(/\?code=.*/, '')}</strong> and type <strong>{s.code}</strong>.</p>
          </div>
        {/if}
      </aside>
    </div>
  </main>
{/if}

<style>
  .page {
    max-width: 68rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 1rem;
    display: grid;
    gap: 1.5rem;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h1 {
    font-size: 2.2rem;
    margin: 0.25rem 0 0.4rem;
  }
  h2 {
    font-size: 1.3rem;
  }
  .row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .resume {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    border-color: var(--amber-border);
    background: #fff6dc;
  }
  .setup {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 1.1rem;
    align-items: start;
  }
  .section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .sets {
    display: grid;
    gap: 0.5rem;
  }
  .set {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.15rem 0.75rem;
    padding: 0.75rem 0.9rem;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--paper-low);
    cursor: pointer;
  }
  .set.on {
    border-color: var(--accent);
    background: var(--accent-wash);
  }
  .set:focus-within {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }
  .set input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .set strong {
    font-family: var(--serif);
    font-size: 1.05rem;
  }
  .set span {
    grid-column: 1;
    color: var(--muted);
    font-size: 0.88rem;
  }
  .set .edit {
    grid-row: 1 / span 2;
    grid-column: 2;
    align-self: center;
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
  }
  .settings {
    display: grid;
    gap: 0.9rem;
  }
  .check {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    font-size: 0.92rem;
    color: var(--ink-soft);
  }
  .check input {
    margin-top: 0.2rem;
  }

  .cockpit {
    max-width: 90rem;
    margin: 0 auto;
    padding: 1rem 1.25rem 2rem;
    display: grid;
    gap: 1rem;
  }
  .cockpit-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .room {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .code {
    font-family: var(--serif);
    font-size: 1.8rem;
    letter-spacing: 0.15em;
    color: var(--accent-dark);
  }
  .columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 1.1rem;
    align-items: start;
  }
  .controls {
    display: grid;
    gap: 1rem;
  }
  .live {
    display: grid;
    gap: 0.9rem;
    border-width: 2px;
    border-color: var(--accent-line);
  }
  .live-head {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 1rem;
  }
  .live h2 {
    font-size: 1.5rem;
    margin-top: 0.2rem;
  }
  .mini-board {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .mini-board span {
    background: var(--paper-low);
    border-radius: 8px;
    padding: 0.25rem 0.6rem;
    font-size: 0.88rem;
    color: var(--muted);
  }
  .mini-board strong {
    color: var(--ink);
    font-family: var(--serif);
  }
  .primary {
    display: grid;
    gap: 0.6rem;
  }
  .one-pick select {
    padding: 0.55rem 0.6rem;
  }
  .secondary {
    border-top: 1px solid var(--line);
    padding-top: 0.75rem;
  }
  .hint {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .problem {
    background: var(--bad-wash);
    border: 1px solid var(--bad-line);
    color: var(--bad);
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    font-weight: 600;
  }
  .key {
    display: grid;
    gap: 0.6rem;
  }
  .key h3 {
    font-size: 1.2rem;
  }
  .key-choices {
    display: grid;
    gap: 0.4rem;
  }
  .explain {
    font-family: var(--serif);
    font-style: italic;
    color: var(--ink-soft);
  }
  .roster ul {
    list-style: none;
    display: grid;
    gap: 0.3rem;
    max-height: 26rem;
    overflow-y: auto;
  }
  .roster li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0.5rem;
    border-radius: 8px;
  }
  .roster li:hover {
    background: var(--paper-low);
  }
  .roster li.offline {
    opacity: 0.6;
  }
  .who {
    display: grid;
    line-height: 1.25;
  }
  .who small {
    color: var(--muted);
  }
  .dot {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--line-strong);
    margin-right: 0.15rem;
  }
  .dot.on {
    background: var(--good);
  }
  .pts {
    font-family: var(--serif);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .remove {
    opacity: 0;
  }
  .roster li:hover .remove,
  .remove:focus-visible {
    opacity: 1;
  }
  details summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--ink-soft);
  }
  .settings-live {
    display: grid;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .preview {
    position: sticky;
    top: 1rem;
    display: grid;
    gap: 0.75rem;
  }
  .preview .section-head {
    margin: 0;
  }
  .screen {
    background: var(--ground);
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    overflow: hidden;
    aspect-ratio: 16 / 10;
    overflow-y: auto;
    box-shadow: var(--shadow-lift);
  }
  .qr-panel {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .qr {
    width: 6.5rem;
    flex: none;
  }
  .qr :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
  @media (max-width: 60rem) {
    .setup,
    .columns {
      grid-template-columns: 1fr;
    }
    .preview {
      position: static;
    }
  }
</style>
