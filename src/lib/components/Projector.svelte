<script lang="ts">
  // The big screen. It shows the room code while students join, then the game:
  // the scoreboard strip across the top and one "moment" at a time below it.
  // While the class answers it shows only progress, never the question, so
  // The One can't read it off the wall.
  import Avatar from './Avatar.svelte';
  import Brand from './Brand.svelte';
  import Choice from './Choice.svelte';
  import Countdown from './Countdown.svelte';
  import Hearts from './Hearts.svelte';
  import QrCode from './QrCode.svelte';
  import Standings from './Standings.svelte';
  import type { View } from '../game/views';
  import { endDetail, endHeadline, helpName, phaseName, plural } from '../words';

  let { view, joinUrl, compact = false }: { view: View; joinUrl: string; compact?: boolean } = $props();

  const deadline = $derived(view.question?.remainingMs != null ? Date.now() + view.question.remainingMs : null);
  const name = (id: string) => view.roster.find((p) => p.id === id)?.nickname ?? 'Someone';
  const one = $derived(view.game?.one.nickname ?? 'The One');
  const q = $derived(view.question);
  const result = $derived(view.game?.result ?? null);
  const joinHost = $derived(joinUrl.replace(/^https?:\/\//, '').replace(/\?code=.*/, ''));

  function choiceState(i: number): 'idle' | 'picked' | 'correct' | 'wrong' | 'dim' {
    if (!q) return 'idle';
    if (q.reveal) return i === q.reveal.correct ? 'correct' : i === q.oneAnswer ? 'wrong' : 'dim';
    if (q.oneAnswer !== null) return i === q.oneAnswer ? 'picked' : 'dim';
    return 'idle';
  }

  // Confetti when a game ends with a winner, once per game.
  let celebrated = '';
  $effect(() => {
    if (compact || view.phase !== 'REVEAL' || !result || !view.game) return;
    const key = `${view.code}:${view.game.ordinal}`;
    if (celebrated === key) return;
    celebrated = key;
    void import('canvas-confetti').then(({ default: confetti }) => {
      const shared = {
        particleCount: result.reason === 'mob_emptied' ? 70 : 40,
        spread: 70,
        ticks: 160,
        colors: ['#9f5037', '#f0d27c', '#b9cde4', '#fffaf3', '#3f6a47'],
        disableForReducedMotion: true,
      };
      confetti({ ...shared, angle: 58, origin: { x: 0, y: 0.75 } });
      confetti({ ...shared, angle: 122, origin: { x: 1, y: 0.75 } });
    });
  });
</script>

<div class="stage" class:compact>
  <header class="top">
    <Brand href={null} size={compact ? 22 : 34} />
    {#if view.phase !== 'LOBBY'}
      <span class="join-hint">Join at <strong>{joinHost}</strong> · code <strong class="code-inline">{view.code}</strong></span>
    {:else}
      <span class="set">{view.setTitle}</span>
    {/if}
  </header>

  {#if view.phase === 'LOBBY'}
    <section class="lobby">
      <div class="join">
        <p class="label">Join the game</p>
        <h1>Grab a device and join the Challenge Team</h1>
        <p class="lede">Go to <strong>{joinHost}</strong> and type the code</p>
        <p class="code" aria-label="Room code {view.code.split('').join(' ')}">
          {#each view.code.split('') as letter, i (i)}<span>{letter}</span>{/each}
        </p>
        <div class="qr-wrap"><QrCode text={joinUrl} label="QR code to join" /></div>
      </div>
      <div class="roster">
        <p class="label">{view.roster.length === 0 ? 'Waiting for players…' : plural(view.roster.length, 'player') + ' in'}</p>
        <ul>
          {#each view.roster as p (p.id)}
            <li class:away={!p.connected}><Avatar name={p.nickname} size={compact ? 24 : 36} /> {p.nickname}</li>
          {/each}
        </ul>
      </div>
    </section>
  {:else}
    {#if view.game && view.phase !== 'ENDED' && view.phase !== 'LEADERBOARD'}
      <div class="board" aria-label="Game board">
        <span><small>Game</small><strong>{view.game.ordinal}</strong></span>
        <span class="spot"><small>Spotlight</small><strong><Avatar name={one} size={compact ? 18 : 30} /> {one}</strong></span>
        <span><small>Challenge Team</small><strong>{view.game.mobCount}</strong></span>
        <span><small>Comeback Crew</small><strong>{view.game.crowdCount}</strong></span>
        <span class="pot"><small>Prize Pot</small><strong>{view.game.bank}</strong></span>
        <span><small>Chances</small><strong><Hearts left={view.game.strikes} total={view.game.baseStrikes} /></strong></span>
        <span><small>Question</small><strong>{Math.max(1, view.game.questionIndex)} / {view.game.deckSize}</strong></span>
        {#if view.game.momentum}
          <span><small>On a Roll</small><strong>{view.game.momentum.awardedOnce ? 'Used' : `${view.game.momentum.progress} / ${view.game.momentum.threshold}`}</strong></span>
        {/if}
      </div>
    {/if}

    <section class="moment" aria-live="polite">
      {#if view.phase === 'BETWEEN'}
        <p class="label">Game {view.game?.ordinal}</p>
        <h1 class="headline"><Avatar name={one} size={compact ? 32 : 64} /> {one} steps into the Spotlight</h1>
        <p class="detail">
          {plural(view.game?.mobCount ?? 0, 'classmate')} on the Challenge Team. Everyone answers first, then {one} answers alone.
          Every time {one} is right, classmates who missed join the Comeback Crew, and the Prize Pot grows.
        </p>
      {:else if view.phase === 'PHASE_A' && q}
        <p class="label">{phaseName.PHASE_A} · Question {q.index}</p>
        <h1 class="headline">Answer on your device!</h1>
        <p class="detail">{one}, eyes on the board, not on your neighbors. Your turn is next.</p>
        <div class="progress">
          <div class="count">
            <strong>{q.answered}</strong>
            <span>of {q.eligible} answered</span>
          </div>
          <Countdown {deadline} paused={view.paused} big />
          <div class="track"><span style="width: {q.eligible ? (100 * q.answered) / q.eligible : 0}%"></span></div>
        </div>
      {:else if view.phase === 'PHASE_A_LOCKED' && q}
        <p class="label">{phaseName.PHASE_A_LOCKED}</p>
        <h1 class="headline">{plural(q.answered, 'answer')} locked in</h1>
        <p class="detail">{one}, the Spotlight Round is next.</p>
      {:else if (view.phase === 'PHASE_B' || view.phase === 'ONE_LOCKED' || view.phase === 'REVEAL') && q && q.choices}
        <p class="label">
          {view.phase === 'REVEAL' ? 'The Reveal' : view.phase === 'ONE_LOCKED' ? `${one}’s final answer` : `Spotlight Round · ${one}’s turn`}
          · Question {q.index}
        </p>
        <h2 class="question">{q.prompt}</h2>
        <div class="choices" role="list">
          {#each q.choices as text, i (i)}
            <Choice
              index={i}
              {text}
              state={choiceState(i)}
              size={compact ? 'normal' : 'large'}
              tally={q.reveal ? q.reveal.counts[i] : null}
              note={q.oneAnswer === i ? `${one}’s answer` : ''}
            />
          {/each}
        </div>

        {#if view.phase === 'PHASE_B' && view.game}
          <div class="helps">
            {#each ['poll', 'ask', 'trust'] as const as h (h)}
              <span class="pill" class:muted={!view.game.helpsAvailable[h]}>{helpName[h]} · {view.game.helpsAvailable[h] ? 'ready' : 'used'}</span>
            {/each}
          </div>
        {/if}

        {#if q.helpResult && view.phase !== 'REVEAL'}
          <div class="help-result">
            {#if q.helpResult.type === 'poll'}
              <strong>Poll the Class:</strong> {plural(q.helpResult.count, 'classmate')} of {q.helpResult.total} chose {String.fromCharCode(65 + q.helpResult.choice)}.
            {:else if q.helpResult.type === 'ask'}
              <strong>Ask Two:</strong>
              {#each q.helpResult.speakers as sp, i (sp.playerId)}
                {i > 0 ? ' and ' : ''}<strong>{sp.nickname}</strong> (chose {String.fromCharCode(65 + sp.choice)})
              {/each}
              — explain your thinking out loud!
            {:else}
              <strong>Go with the Class:</strong> {one} locks in the class’s top answer, {String.fromCharCode(65 + q.helpResult.choice)}.
            {/if}
          </div>
        {/if}

        {#if q.reveal}
          <div class="verdict" class:good={q.reveal.oneCorrect} class:bad={!q.reveal.oneCorrect}>
            {#if q.reveal.oneCorrect}
              <strong>{one} got it!</strong>
              {#if q.reveal.demoted.length}
                {q.reveal.demoted.map(name).join(', ')} {q.reveal.demoted.length === 1 ? 'joins' : 'join'} the Comeback Crew — still playing!
                The Prize Pot grows by {q.reveal.bankDelta}.
              {:else}
                The whole Challenge Team got it too.
              {/if}
            {:else}
              <strong>Not this time.</strong> {one} loses a chance. The Challenge Team stays strong.
            {/if}
            {#if q.reveal.momentumFilled}<span class="pill good">On a Roll! {one} earns back a chance</span>{/if}
          </div>
          {#if q.reveal.explanation}<p class="explain">{q.reveal.explanation}</p>{/if}
          {#if !compact}
            <div class="deltas">
              {#each q.reveal.deltas.filter((d) => d.points > 0 && d.reason === 'correct_answer').slice(0, 14) as d (d.playerId)}
                <span>{name(d.playerId)} +{d.points}</span>
              {/each}
            </div>
          {/if}
        {/if}

        {#if result && view.phase === 'REVEAL'}
          <div class="game-over">
            <p class="label">Game over</p>
            <h2>{endHeadline(result.reason, one, result.bankedByOne)}</h2>
            <p>{endDetail(result.reason, one, result.payouts.filter((p) => p.playerId !== view.game?.one.id).length)}</p>
            <div class="deltas">
              {#each result.payouts.slice(0, 12) as p (p.playerId)}<span>{name(p.playerId)} +{p.points}</span>{/each}
            </div>
          </div>
        {/if}
      {:else if view.phase === 'LEADERBOARD'}
        {#if result}
          <p class="label">Game {view.game?.ordinal} · {endHeadline(result.reason, one, result.bankedByOne)}</p>
        {/if}
        <h1 class="headline">Leaderboard</h1>
        <div class="split">
          <Standings rows={view.standings} limit={compact ? 6 : 10} big={!compact} />
          {#if view.pendingNextOne}
            <div class="next-up">
              <p class="label">Up next in the Spotlight</p>
              <p class="next-name"><Avatar name={view.pendingNextOne.nickname} size={compact ? 32 : 72} /> {view.pendingNextOne.nickname}</p>
            </div>
          {/if}
        </div>
      {:else if view.phase === 'ENDED'}
        <p class="label">Thanks for playing</p>
        <h1 class="headline">Final standings</h1>
        <div class="podium">
          {#each view.standings.slice(0, 3) as row, i (row.playerId)}
            <div class="step s{i + 1}">
              <Avatar name={row.nickname} size={compact ? 30 : 64} />
              <strong>{row.nickname}</strong>
              <span>{row.points} pts</span>
            </div>
          {/each}
        </div>
        <Standings rows={view.standings.slice(3)} limit={compact ? 4 : 9} />
      {/if}
    </section>
  {/if}

  {#if view.paused}
    <div class="paused" role="status">
      <strong>Game paused</strong>
      <span>{view.pauseReason === 'one_disconnected' ? `Waiting for ${one} to reconnect…` : 'Your teacher paused the game.'}</span>
    </div>
  {/if}
</div>

<style>
  .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-height: 100%;
    padding: 1.5rem 2rem 2rem;
    font-size: clamp(1rem, 1.4vw, 1.35rem);
  }
  .compact {
    padding: 0.75rem;
    gap: 0.6rem;
    font-size: 0.85rem;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .join-hint,
  .set {
    color: var(--muted);
  }
  .code-inline {
    font-family: var(--serif);
    letter-spacing: 0.12em;
    color: var(--accent-dark);
  }

  .lobby {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 2rem;
    align-items: start;
  }
  .compact .lobby {
    gap: 0.75rem;
  }
  .join {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 1.75rem;
    display: grid;
    gap: 0.75rem;
    justify-items: start;
    box-shadow: var(--shadow-rest);
  }
  .compact .join {
    padding: 0.75rem;
    gap: 0.35rem;
  }
  .join h1 {
    font-size: 2.2em;
  }
  .compact .join h1 {
    font-size: 1.15rem;
  }
  .code {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.6rem;
    width: 100%;
    max-width: 34rem;
    margin: 0.4rem 0;
  }
  .compact .code {
    gap: 0.3rem;
  }
  .code span {
    display: grid;
    place-items: center;
    aspect-ratio: 5 / 6;
    font-family: var(--serif);
    font-weight: 700;
    font-size: clamp(2rem, 4.2vw, 4.2rem);
    background: var(--paper);
    border: 1.5px solid var(--line-strong);
    border-radius: 12px;
    box-shadow: var(--shadow-tile);
    color: var(--accent-dark);
  }
  .compact .code span {
    font-size: 1.3rem;
    border-radius: 7px;
  }
  .helps .pill {
    font-size: 0.8em;
    padding: 0.3rem 0.8rem;
  }
  .qr-wrap {
    width: clamp(7rem, 16vw, 12rem);
  }
  .compact .qr-wrap {
    width: 4.5rem;
  }
  .qr-wrap :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
  .roster ul {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .roster li {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.25rem 0.85rem 0.25rem 0.3rem;
    font-weight: 600;
    animation: rise 0.3s both;
  }
  .roster li.away {
    opacity: 0.5;
  }

  .board {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .board > span {
    display: grid;
    gap: 0.1rem;
    padding: 0.45rem 0.9rem;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 10px;
    flex: 1 1 auto;
  }
  .compact .board > span {
    padding: 0.25rem 0.5rem;
  }
  .board small {
    font-size: 0.6em;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .board strong {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: var(--serif);
    font-size: 1.3em;
    font-variant-numeric: tabular-nums;
  }
  .board .spot {
    background: var(--accent-wash);
    border-color: var(--accent-line);
  }
  .board .pot strong {
    color: var(--accent-dark);
  }

  .moment {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    animation: rise 0.35s both;
  }
  .compact .moment {
    gap: 0.5rem;
  }
  .headline {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 2.6em;
  }
  .compact .headline {
    font-size: 1.3rem;
  }
  .detail {
    color: var(--muted);
    max-width: 50rem;
  }
  .progress {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: 1rem 2rem;
    padding: 1.5rem 1.75rem;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: var(--shadow-rest);
    max-width: 56rem;
  }
  .compact .progress {
    padding: 0.6rem 0.8rem;
  }
  .count {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    font-size: 1.4em;
    color: var(--muted);
  }
  .count strong {
    font-family: var(--serif);
    font-size: 3em;
    line-height: 1;
    color: var(--ink);
  }
  .compact .count strong {
    font-size: 1.8em;
  }
  .track {
    grid-column: 1 / -1;
    height: 1rem;
    background: var(--paper-low);
    border: 1px solid var(--line);
    border-radius: 999px;
    overflow: hidden;
  }
  .track span {
    display: block;
    height: 100%;
    background: var(--accent);
    transition: width 0.3s;
  }
  .question {
    font-size: clamp(1.6rem, 3.4vw, 3rem);
    font-weight: 600;
  }
  .compact .question {
    font-size: 1.15rem;
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    gap: 0.75rem;
  }
  .compact .choices {
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }
  .helps {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .help-result,
  .verdict,
  .explain {
    padding: 0.85rem 1.1rem;
    border-radius: 10px;
    background: var(--paper);
    border: 1px solid var(--line);
  }
  .help-result {
    background: var(--amber);
    border-color: var(--amber-border);
  }
  .verdict.good {
    background: var(--good-wash);
    border-color: var(--good-line);
  }
  .verdict.bad {
    background: var(--bad-wash);
    border-color: var(--bad-line);
  }
  .explain {
    font-family: var(--serif);
    font-style: italic;
    color: var(--ink-soft);
  }
  .deltas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .deltas span {
    background: var(--good-wash);
    color: var(--good);
    border-radius: 999px;
    padding: 0.15rem 0.7rem;
    font-weight: 700;
    font-size: 0.9em;
  }
  .game-over {
    padding: 1.25rem 1.5rem;
    border-radius: 14px;
    background: var(--paper);
    border: 2px solid var(--accent);
    display: grid;
    gap: 0.5rem;
    box-shadow: var(--shadow-lift);
  }
  .game-over h2 {
    font-size: 2em;
    color: var(--accent-dark);
  }
  .compact .game-over h2 {
    font-size: 1.1rem;
  }
  .split {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 2rem;
    align-items: start;
  }
  .next-up {
    background: var(--accent-wash);
    border: 1px solid var(--accent-line);
    border-radius: 14px;
    padding: 1.5rem;
    display: grid;
    gap: 0.5rem;
  }
  .next-name {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: var(--serif);
    font-weight: 700;
    font-size: 2em;
  }
  .compact .next-name {
    font-size: 1rem;
  }
  .podium {
    display: grid;
    grid-template-columns: 1fr 1.15fr 1fr;
    align-items: end;
    gap: 1rem;
    max-width: 48rem;
  }
  .step {
    display: grid;
    justify-items: center;
    gap: 0.3rem;
    padding: 1rem 0.5rem;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 14px 14px 4px 4px;
    font-size: 1.2em;
    text-align: center;
  }
  .step span {
    color: var(--muted);
  }
  .s1 {
    order: 2;
    padding-top: 2rem;
    background: var(--accent-wash);
    border-color: var(--accent-line);
  }
  .s2 {
    order: 1;
  }
  .s3 {
    order: 3;
  }
  .paused {
    position: absolute;
    inset: auto 1rem 1rem 1rem;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--ink-soft);
    color: var(--paper);
    border-radius: 12px;
    font-size: 1.2em;
  }
  @media (max-width: 50rem) {
    .lobby,
    .split {
      grid-template-columns: 1fr;
    }
    .stage:not(.compact) {
      padding: 1rem;
    }
  }
</style>
