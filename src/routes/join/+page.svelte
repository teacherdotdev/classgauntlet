<script lang="ts">
  import { page } from '$app/state';
  import Avatar from '#lib/components/Avatar.svelte';
  import Brand from '#lib/components/Brand.svelte';
  import Choice from '#lib/components/Choice.svelte';
  import Countdown from '#lib/components/Countdown.svelte';
  import Hearts from '#lib/components/Hearts.svelte';
  import Standings from '#lib/components/Standings.svelte';
  import { NICKNAME_MAX } from '#lib/game/engine.ts';
  import { cleanRoomCode } from '#lib/protocol.ts';
  import { student } from '#lib/student.svelte.ts';
  import { endHeadline, helpBlurb, helpName, roleName } from '#lib/words.ts';

  let code = $state(cleanRoomCode(page.url.searchParams.get('code') ?? ''));
  let nickname = $state('');
  /** The One's highlighted answer before they commit to it. */
  let draft = $state<number | null>(null);
  let confirmLeave = $state(false);

  // Coming back to a game this device was already in: go straight back in.
  let autoTried = false;
  $effect.pre(() => {
    if (!autoTried && code.length === 6 && student.status === 'idle') {
      autoTried = true;
      const seat = student.savedSeat(code);
      if (seat) void student.join(code, seat.nickname);
    }
  });

  function submit(event: SubmitEvent) {
    event.preventDefault();
    code = cleanRoomCode(code);
    if (code.length !== 6 || !nickname.trim()) return;
    history.replaceState(history.state, '', `/join?code=${code}`);
    void student.join(code, nickname);
  }

  const view = $derived(student.view);
  const me = $derived(view?.self);
  const q = $derived(view?.question ?? null);
  const iAmOne = $derived(me?.role === 'one');
  const one = $derived(view?.game?.one.nickname ?? 'The One');
  const letter = (i: number | null | undefined) => (i == null ? '' : String.fromCharCode(65 + i));

  // A new question clears The One's draft.
  let lastAttempt = '';
  $effect(() => {
    const id = q?.attemptId ?? '';
    if (id !== lastAttempt) {
      lastAttempt = id;
      draft = null;
    }
  });

  function choiceState(i: number): 'idle' | 'picked' | 'correct' | 'wrong' | 'dim' {
    if (!q) return 'idle';
    if (q.reveal) {
      if (i === q.reveal.correct) return 'correct';
      return i === me?.myAnswer ? 'wrong' : 'dim';
    }
    if (iAmOne && view?.phase === 'PHASE_B') return draft === i ? 'picked' : 'idle';
    if (me?.myAnswer != null) return i === me.myAnswer ? 'picked' : 'dim';
    return 'idle';
  }

  const canAnswerClass = $derived(view?.phase === 'PHASE_A' && !view.paused && !!me?.eligible && me.myAnswer === null && !iAmOne);
  const canAnswerOne = $derived(view?.phase === 'PHASE_B' && !view.paused && iAmOne);
</script>

<svelte:head><title>{view ? `${student.nickname} · ${view.code}` : 'Join a game'} · 1 vs 100 Classroom</title></svelte:head>

<main class="app">
  <header class="bar">
    <Brand size={24} />
    {#if student.status === 'playing' || student.status === 'reconnecting'}
      <span class="live" class:off={student.status !== 'playing'}>
        <span class="dot" aria-hidden="true"></span>
        {student.status === 'playing' ? 'Live' : 'Reconnecting…'}
      </span>
    {/if}
  </header>

  {#if !view || student.status === 'idle' || student.status === 'denied' || student.status === 'connecting' || student.status === 'removed'}
    <section class="join panel">
      {#if student.status === 'removed'}
        <h1>You left the game</h1>
        <p class="lede">Your teacher removed you from this game. You can join again with a new nickname.</p>
      {:else}
        <h1>Join the game</h1>
        <p class="lede">Type the code from the board and the name your class knows you by.</p>
      {/if}
      <form onsubmit={submit}>
        <label class="field">
          Code
          <input
            class="code-input"
            bind:value={code}
            oninput={() => (code = cleanRoomCode(code))}
            maxlength="6"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            placeholder="ABC234"
            required
          />
        </label>
        <label class="field">
          Nickname
          <input bind:value={nickname} maxlength={NICKNAME_MAX} autocomplete="nickname" placeholder="Your first name" required />
        </label>
        <button class="btn-primary big" type="submit" disabled={student.status === 'connecting'}>
          {student.status === 'connecting' ? 'Joining…' : 'Join the game'}
        </button>
      </form>
      {#if student.status === 'connecting'}
        <p class="hint" role="status">
          Finding your teacher’s game…
          {#if student.slow}<br />Still trying. Check the code on the board; if it’s right, your school network may be slow to connect.{/if}
        </p>
      {/if}
      {#if student.problem}<p class="problem" role="alert">{student.problem}</p>{/if}
    </section>
  {:else if me}
    <section class="me">
      <Avatar name={me.nickname} size={40} />
      <div>
        <strong>{me.nickname}</strong>
        <span class="pill" class:good={me.role === 'one'} class:muted={me.role === 'crowd'}>{roleName[me.role]}</span>
      </div>
      <div class="stats">
        <span><small>Points</small><strong>{me.points}</strong></span>
        {#if me.streak > 1}<span><small>Streak</small><strong>{me.streak}</strong></span>{/if}
        {#if view.game && view.phase !== 'LOBBY' && view.phase !== 'ENDED'}
          <span><small>Pot</small><strong>{view.game.bank}</strong></span>
          <span><small>Chances</small><strong><Hearts left={view.game.strikes} total={view.game.baseStrikes} /></strong></span>
        {/if}
      </div>
    </section>

    {#if student.status === 'reconnecting'}
      <p class="banner">Lost the connection to your teacher’s computer. Getting you back in… your points are safe.</p>
    {/if}
    {#if view.paused}
      <p class="banner">Game paused. {view.pauseReason === 'one_disconnected' ? `Waiting for ${one} to reconnect.` : ''}</p>
    {/if}

    <section class="screen" aria-live="polite">
      {#if view.phase === 'LOBBY'}
        <h1>You’re in!</h1>
        <p class="lede">Look for your name on the board. The game starts when your teacher is ready.</p>
      {:else if view.phase === 'BETWEEN'}
        {#if iAmOne}
          <h1>You’re in the Spotlight!</h1>
          <p class="lede">The class answers each question first. Then it’s your turn, with three lifelines to help. Every time you’re right, classmates who missed join the Comeback Crew and your Prize Pot grows.</p>
        {:else}
          <h1>{one} is in the Spotlight</h1>
          <p class="lede">
            {me.role === 'crowd'
              ? 'You’re on the Comeback Crew: keep answering, keep scoring.'
              : 'You’re on the Challenge Team. Get answers right to stay on it and make the Spotlight harder.'}
          </p>
        {/if}
      {:else if view.phase === 'PHASE_A' || view.phase === 'PHASE_A_LOCKED'}
        <div class="qhead">
          <span class="label">{view.phase === 'PHASE_A' ? 'Everybody answers' : 'Answers locked'} · Question {q?.index}</span>
          {#if view.phase === 'PHASE_A'}<Countdown deadline={student.deadline} paused={view.paused} />{/if}
        </div>
        {#if iAmOne}
          <h1>{view.phase === 'PHASE_A' ? 'The class is answering' : 'Your question is next'}</h1>
          <p class="lede">Take a breath. Your question is coming next, with lifelines if you need them.</p>
          <p class="count">{q?.answered} / {q?.eligible} classmates answered</p>
        {:else if q?.prompt && q.choices}
          <h2 class="question">{q.prompt}</h2>
          <div class="choices">
            {#each q.choices as text, i (i)}
              <Choice index={i} {text} state={choiceState(i)} onclick={canAnswerClass ? () => student.answer(i) : undefined} />
            {/each}
          </div>
          <p class="status">
            {#if me.myAnswer !== null}
              Locked in: <strong>{letter(me.myAnswer)}</strong>. {q.answered} / {q.eligible} answered.
            {:else if view.phase === 'PHASE_A_LOCKED'}
              Time’s up. No answer this round.
            {:else}
              Tap your answer. It locks in right away.
            {/if}
          </p>
        {:else}
          <h1>You’ll jump in on the next question</h1>
          <p class="lede">You joined while this question was open. Hang tight!</p>
        {/if}
      {:else if (view.phase === 'PHASE_B' || view.phase === 'ONE_LOCKED' || view.phase === 'REVEAL') && q?.choices}
        <div class="qhead">
          <span class="label">
            {view.phase === 'REVEAL' ? 'The Reveal' : iAmOne ? 'Your Spotlight Round' : `${one}’s turn`} · Question {q.index}
          </span>
        </div>
        <h2 class="question">{q.prompt}</h2>

        {#if me.isSpeaker && view.phase !== 'REVEAL'}
          <p class="speaker">You’ve been asked! Tell {one} out loud why you chose <strong>{letter(me.myAnswer)}</strong>.</p>
        {/if}

        <div class="choices">
          {#each q.choices as text, i (i)}
            <Choice
              index={i}
              {text}
              state={choiceState(i)}
              note={q.reveal && i === q.oneAnswer ? `${iAmOne ? 'Your' : `${one}’s`} answer` : ''}
              tally={q.reveal ? q.reveal.counts[i] : null}
              onclick={canAnswerOne && q.helpUsed !== 'trust' ? () => (draft = i) : undefined}
            />
          {/each}
        </div>

        {#if view.phase === 'PHASE_B' && iAmOne}
          <button class="btn-primary big final" disabled={draft === null || view.paused} onclick={() => draft !== null && student.oneAnswer(draft)}>
            {draft === null ? 'Pick an answer' : `Final answer: ${letter(draft)}`}
          </button>
          {#if q.helpResult}
            <div class="help-result">
              {#if q.helpResult.type === 'poll'}
                <strong>Poll the Class:</strong> {q.helpResult.count} of {q.helpResult.total} classmates chose {letter(q.helpResult.choice)}.
              {:else if q.helpResult.type === 'ask'}
                <strong>Ask Two:</strong>
                {#each q.helpResult.speakers as sp, i (sp.playerId)}{i > 0 ? ' and ' : ''}<strong>{sp.nickname}</strong> chose {letter(sp.choice)}{/each}.
                Listen to them explain — one of them is right.
              {/if}
            </div>
          {:else if view.game}
            <div class="helps" aria-label="Lifelines">
              <p class="label">Lifelines · one per question</p>
              <button class="help" disabled={!view.game.helpsAvailable.poll || draft === null} onclick={() => draft !== null && student.help('poll', draft)}>
                <strong>{helpName.poll}</strong>
                <span>{view.game.helpsAvailable.poll ? (draft === null ? 'Pick an answer first, then poll it' : `See how many chose ${letter(draft)}`) : 'Used'}</span>
              </button>
              <button class="help" disabled={!view.game.helpsAvailable.ask} onclick={() => student.help('ask')}>
                <strong>{helpName.ask}</strong>
                <span>{view.game.helpsAvailable.ask ? helpBlurb.ask : 'Used'}</span>
              </button>
              <button class="help" disabled={!view.game.helpsAvailable.trust} onclick={() => student.help('trust')}>
                <strong>{helpName.trust}</strong>
                <span>{view.game.helpsAvailable.trust ? helpBlurb.trust : 'Used'}</span>
              </button>
            </div>
          {/if}
        {:else if view.phase === 'PHASE_B'}
          <p class="status">{one} is thinking… {me.myAnswer !== null ? `You chose ${letter(me.myAnswer)}.` : ''}</p>
        {:else if view.phase === 'ONE_LOCKED'}
          <p class="status">
            {iAmOne ? 'Your' : `${one}’s`} final answer: <strong>{letter(q.oneAnswer)}</strong>. Eyes on the board for the reveal!
          </p>
        {:else if q.reveal}
          <div class="result" class:good={me.delta > 0 || (iAmOne && q.reveal.oneCorrect)}>
            {#if iAmOne}
              <strong>{q.reveal.oneCorrect ? 'You got it!' : 'Not this time.'}</strong>
              {q.reveal.oneCorrect ? `+${me.delta} points, and the Prize Pot grows.` : 'You lost a chance.'}
            {:else if me.myAnswer === null}
              No answer this time. The answer was {letter(q.reveal.correct)}.
            {:else if me.myAnswer === q.reveal.correct}
              <strong>Correct!</strong> +{me.delta} points{me.streak > 1 ? ` · ${me.streak} in a row` : ''}.
            {:else}
              <strong>Not quite.</strong> The answer was {letter(q.reveal.correct)}.
            {/if}
            {#if me.demoted}
              <p>You’re on the Comeback Crew now — still playing and still scoring.</p>
            {/if}
          </div>
          {#if q.reveal.explanation}<p class="explain">{q.reveal.explanation}</p>{/if}
          {#if view.game?.result}
            <div class="game-over">
              <p class="label">Game over</p>
              <h2>{endHeadline(view.game.result.reason, one, view.game.result.bankedByOne)}</h2>
              {#if me.payout > 0}<p><strong>You earned +{me.payout} in the finish!</strong></p>{/if}
            </div>
          {/if}
        {/if}
      {:else if view.phase === 'LEADERBOARD' || view.phase === 'ENDED'}
        <h1>{view.phase === 'ENDED' ? 'Final standings' : 'Leaderboard'}</h1>
        <p class="lede">
          You’re <strong>#{me.rank}</strong> with <strong>{me.points}</strong> points.
          {#if view.phase === 'LEADERBOARD' && view.pendingNextOne?.id === me.id}<br /><strong>You’re up next in the Spotlight!</strong>{/if}
        </p>
        <Standings rows={view.standings} limit={8} highlight={me.id} />
      {/if}
    </section>

    {#if view.phase !== 'ENDED'}
      <div class="leave">
        {#if confirmLeave}
          Leave this game? Your points stay with your teacher.
          <button class="btn-danger" onclick={() => student.leave()}>Leave</button>
          <button class="btn-quiet" onclick={() => (confirmLeave = false)}>Stay</button>
        {:else}
          <button class="btn-quiet" onclick={() => (confirmLeave = true)}>Leave game</button>
        {/if}
      </div>
    {/if}
  {:else}
    <section class="join panel">
      <p class="lede">Getting back into game <strong>{student.code}</strong>…</p>
      {#if student.slow}
        <p class="hint">Your teacher’s computer isn’t answering yet. If the game is over, join a new one.</p>
        <button class="btn-ghost" onclick={() => student.leaveQuietly()}>Join a different game</button>
      {/if}
    </section>
  {/if}

  {#if student.notice}<p class="toast" role="status">{student.notice}</p>{/if}
</main>

<style>
  .app {
    max-width: 40rem;
    margin: 0 auto;
    padding: 0.75rem 1rem 2rem;
    display: grid;
    gap: 0.9rem;
    min-height: 100dvh;
    align-content: start;
  }
  .bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .live {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--good);
  }
  .live .dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: currentColor;
  }
  .live.off {
    color: var(--bad);
  }
  .join {
    display: grid;
    gap: 0.9rem;
    border-radius: 14px;
    padding: 1.5rem;
    margin-top: 1rem;
  }
  .join h1 {
    font-size: 1.8rem;
  }
  form {
    display: grid;
    gap: 0.9rem;
  }
  .code-input {
    font-family: var(--serif) !important;
    font-size: 1.8rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.3em;
    text-transform: uppercase;
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
  .me {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.4rem 0.75rem;
    align-items: center;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 0.75rem;
  }
  .me > div:first-of-type {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .stats {
    grid-column: 1 / -1;
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .stats span {
    flex: 1;
    display: grid;
    background: var(--paper-low);
    border-radius: 8px;
    padding: 0.3rem 0.6rem;
  }
  .stats small {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .stats strong {
    font-family: var(--serif);
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;
  }
  .banner {
    background: var(--amber);
    border: 1px solid var(--amber-border);
    color: #6b4a00;
    border-radius: 10px;
    padding: 0.6rem 0.8rem;
    font-weight: 600;
  }
  .screen {
    display: grid;
    gap: 0.85rem;
    animation: rise 0.3s both;
  }
  .screen h1 {
    font-size: 1.7rem;
  }
  .qhead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }
  .question {
    font-size: 1.45rem;
    font-weight: 600;
  }
  .choices {
    display: grid;
    gap: 0.6rem;
  }
  .status,
  .count {
    color: var(--ink-soft);
  }
  .count {
    font-family: var(--serif);
    font-size: 1.3rem;
    font-weight: 700;
  }
  .final {
    width: 100%;
  }
  .helps {
    display: grid;
    gap: 0.5rem;
  }
  .help {
    display: grid;
    text-align: left;
    gap: 0.1rem;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    border: 1px solid var(--line-strong);
    background: var(--paper);
    cursor: pointer;
  }
  .help:hover:not(:disabled) {
    background: var(--accent-wash);
    border-color: var(--accent);
  }
  .help:disabled {
    cursor: default;
    opacity: 0.55;
  }
  .help span {
    font-size: 0.85rem;
    color: var(--muted);
  }
  .help-result,
  .speaker {
    background: var(--amber);
    border: 1px solid var(--amber-border);
    border-radius: 10px;
    padding: 0.75rem 0.9rem;
  }
  .speaker {
    font-size: 1.1rem;
    animation: shake 0.4s 2;
  }
  .result {
    padding: 0.85rem 1rem;
    border-radius: 10px;
    background: var(--paper);
    border: 1px solid var(--line);
    font-size: 1.1rem;
  }
  .result.good {
    background: var(--good-wash);
    border-color: var(--good-line);
  }
  .result p {
    margin-top: 0.4rem;
    font-size: 0.95rem;
  }
  .explain {
    font-family: var(--serif);
    font-style: italic;
    color: var(--ink-soft);
  }
  .game-over {
    padding: 1rem;
    border: 2px solid var(--accent);
    border-radius: 12px;
    background: var(--paper);
    display: grid;
    gap: 0.35rem;
  }
  .game-over h2 {
    color: var(--accent-dark);
    font-size: 1.35rem;
  }
  .leave {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    color: var(--muted);
    font-size: 0.9rem;
    margin-top: 1rem;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 1rem;
    transform: translateX(-50%);
    background: var(--ink-soft);
    color: var(--paper);
    padding: 0.6rem 1rem;
    border-radius: 10px;
    box-shadow: var(--shadow-dialog);
    max-width: calc(100% - 2rem);
  }
</style>
