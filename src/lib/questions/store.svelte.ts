import type { QuestionSet } from '../game/types';
import { randomId } from '../game/engine';
import { sampleSet, sampleSetId } from './sample';

/**
 * A teacher's question sets live in this browser's local storage; nothing is
 * uploaded. Share links and CSV files move them between computers.
 */

const key = 'review1v100:sets';

function load(): QuestionSet[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as QuestionSet[];
  } catch {
    /* fall through to the sample */
  }
  return [sampleSet()];
}

class QuestionLibrary {
  sets = $state<QuestionSet[]>(load());

  #save() {
    try {
      localStorage.setItem(key, JSON.stringify(this.sets));
    } catch {
      /* storage full or blocked */
    }
  }

  get(id: string): QuestionSet | undefined {
    return this.sets.find((set) => set.id === id);
  }

  /** Newest first, with the sample at the end. */
  get sorted(): QuestionSet[] {
    return [...this.sets].sort(
      (a, b) => Number(a.id === sampleSetId) - Number(b.id === sampleSetId) || b.updatedAt - a.updatedAt,
    );
  }

  save(set: QuestionSet) {
    const copy = { ...$state.snapshot(set), updatedAt: Date.now() } as QuestionSet;
    const index = this.sets.findIndex((s) => s.id === set.id);
    if (index >= 0) this.sets[index] = copy;
    else this.sets.push(copy);
    this.#save();
  }

  add(set: Omit<QuestionSet, 'id' | 'updatedAt'>): QuestionSet {
    const created = { ...set, id: randomId(), updatedAt: Date.now() };
    this.sets.push(created);
    this.#save();
    return created;
  }

  duplicate(id: string): QuestionSet | undefined {
    const original = this.get(id);
    if (!original) return undefined;
    const copy = $state.snapshot(original) as QuestionSet;
    return this.add({
      ...copy,
      title: `${copy.title.replace(/^Sample: /, '')} (copy)`,
      questions: copy.questions.map((q) => ({ ...q, id: randomId() })),
    });
  }

  remove(id: string) {
    this.sets = this.sets.filter((set) => set.id !== id);
    this.#save();
  }

  restoreSample() {
    if (!this.get(sampleSetId)) {
      this.sets.push(sampleSet());
      this.#save();
    }
  }
}

export const library = new QuestionLibrary();
