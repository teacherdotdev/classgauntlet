<script lang="ts">
  // One answer, as a card with a raised letter tile. Used on phones (as a
  // button) and on the projector (as a display).
  let {
    index,
    text,
    state = 'idle',
    tally = null,
    note = '',
    onclick,
    disabled = false,
    size = 'normal',
  }: {
    index: number;
    text: string;
    state?: 'idle' | 'picked' | 'correct' | 'wrong' | 'dim';
    tally?: number | null;
    note?: string;
    onclick?: () => void;
    disabled?: boolean;
    size?: 'normal' | 'large';
  } = $props();
  const letter = $derived(String.fromCharCode(65 + index));
  const family = $derived(['a', 'b', 'c', 'd'][index] ?? 'a');
</script>

<svelte:element
  this={onclick ? 'button' : 'div'}
  type={onclick ? 'button' : undefined}
  class="choice {state} {size}"
  style="--wash: var(--{family}-wash); --line-c: var(--{family}-line); --ink-c: var(--{family}-ink)"
  onclick={onclick}
  disabled={onclick ? disabled : undefined}
  aria-pressed={onclick ? state === 'picked' : undefined}
  role={onclick ? undefined : 'listitem'}
>
  <span class="tile" aria-hidden="true">{letter}</span>
  <span class="text"><span class="sr-only">{letter}. </span>{text}</span>
  {#if state === 'correct'}<span class="mark" aria-label="correct answer">✓</span>{/if}
  {#if state === 'wrong'}<span class="mark" aria-label="not the answer">✗</span>{/if}
  {#if tally !== null}<span class="tally">{tally}</span>{/if}
  {#if note}<span class="note">{note}</span>{/if}
</svelte:element>

<style>
  .choice {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.85rem;
    width: 100%;
    text-align: left;
    padding: 0.75rem 0.9rem;
    border-radius: 12px;
    border: 2px solid var(--line-c);
    background: var(--paper);
    font: inherit;
    color: var(--ink);
    transition:
      transform 0.12s,
      box-shadow 0.12s,
      background 0.12s,
      opacity 0.2s;
    position: relative;
  }
  button.choice {
    cursor: pointer;
    min-height: 4rem;
  }
  button.choice:hover:not(:disabled) {
    background: var(--wash);
    transform: translateY(-1px);
    box-shadow: var(--shadow-lift);
  }
  button.choice:disabled {
    cursor: default;
  }
  .tile {
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 9px;
    border: 1.5px solid var(--line-c);
    background: var(--wash);
    color: var(--ink-c);
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.2rem;
    box-shadow: var(--shadow-tile);
  }
  .text {
    font-family: var(--serif);
    font-size: 1.15rem;
    font-weight: 500;
    overflow-wrap: anywhere;
  }
  .large {
    padding: 1rem 1.25rem;
    gap: 1.1rem;
  }
  .large .tile {
    width: 3.4rem;
    height: 3.4rem;
    font-size: 1.7rem;
  }
  .large .text {
    font-size: clamp(1.3rem, 2.4vw, 2.1rem);
  }
  .picked {
    background: var(--wash);
    border-color: var(--ink-c);
    box-shadow: 0 0 0 3px var(--line-c);
  }
  .correct {
    background: var(--good-wash);
    border-color: var(--good);
    box-shadow: 0 0 0 3px var(--good-line);
  }
  .wrong {
    background: var(--bad-wash);
    border-color: var(--bad-line);
  }
  .dim {
    opacity: 0.45;
  }
  .mark {
    font-weight: 700;
    font-size: 1.3rem;
  }
  .correct .mark {
    color: var(--good);
  }
  .wrong .mark {
    color: var(--bad);
  }
  .tally {
    font-family: var(--serif);
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--ink-soft);
    background: var(--paper-low);
    border-radius: 999px;
    padding: 0.1rem 0.7rem;
    min-width: 2.2rem;
    text-align: center;
  }
  .large .tally {
    font-size: 1.6rem;
  }
  .note {
    grid-column: 2 / -1;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--ink-c);
  }
</style>
