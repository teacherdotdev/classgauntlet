import type { Question, QuestionSet } from '../game/types';
import { randomId } from '../game/engine';

/**
 * Question files. Two layouts are accepted, with a header row:
 *
 * 1. Simple (what the template uses, and what a spreadsheet paste looks like):
 *      question, A, B, C, D, answer, explanation
 *    D is optional. `answer` is a letter (A–D), or the text of the right answer.
 *
 * 2. The original open-source project's format:
 *      set title, subject, grade, question, choices, correct, explanation
 *    `choices` is a JSON array and `correct` a zero-based index. A file with
 *    several set titles becomes several sets.
 *
 * 3. Blooket's spreadsheet import template: a title row, then
 *      Question #, Question Text, Answer 1–4, Time Limit, Correct Answer(s)
 *    The correct answer is a number (1–4). Blooket allows several right
 *    answers; the game takes one, so the first is kept.
 *
 * Commas or tabs both work, so cells pasted straight from Google Sheets or
 * Excel import too.
 */

export function parseDelimited(text: string): string[][] {
  // Look past the first line: Blooket's template opens with a title cell that spans two lines.
  const start = text.split(/\r?\n/, 5).join('\n');
  const delimiter = (start.match(/\t/g)?.length ?? 0) > (start.match(/,/g)?.length ?? 0) ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === delimiter) {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ''));
}

/** "Answer 3\n(Optional)" → "answer 3". */
const norm = (header: string) =>
  header
    .replace(/\([^)]*\)/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const questionHeaders = ['question text', 'question', 'prompt', 'q'];

/** `errors` are rows that were skipped; `notes` are rows imported with a change. */
export type ImportResult = { sets: QuestionSet[]; errors: string[]; notes: string[] };

export function importQuestions(text: string, fallbackTitle = 'Imported questions'): ImportResult {
  const all = parseDelimited(text.replace(/^﻿/, ''));
  // The header is usually the first row, but Blooket's template has a title row above it.
  const headerAt = Math.max(0, all.slice(0, 5).findIndex((row) => row.some((h) => questionHeaders.includes(norm(h)))));
  const rows = all.slice(headerAt);
  const fail = (message: string): ImportResult => ({ sets: [], errors: [message], notes: [] });
  if (rows.length < 2) return fail('The file needs a header row and at least one question.');
  const headers = rows[0].map(norm);
  /** The first name in the list that some column has wins, so "question text" beats Blooket's "Question #". */
  const col = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((i) => i >= 0) ?? -1;
  const errors: string[] = [];
  const notes: string[] = [];
  const groups = new Map<string, { subject?: string; grade?: string; questions: Question[] }>();
  const add = (title: string, question: Question, subject?: string, grade?: string) => {
    const group = groups.get(title) ?? { subject, grade, questions: [] };
    group.questions.push(question);
    groups.set(title, group);
  };

  const questionCol = col(...questionHeaders);
  const explanationCol = col('explanation', 'why', 'reason', 'feedback');
  const titleCol = col('set title', 'set', 'title');
  const subjectCol = col('subject');
  const gradeCol = col('grade');
  if (questionCol < 0) return fail('Add a “question” column to the header row.');

  const choicesCol = col('choices');
  const original = choicesCol >= 0;
  const letterCols = ['a', 'b', 'c', 'd'].map((letter, i) =>
    col(letter, `choice ${letter}`, `option ${letter}`, `answer ${letter}`, `answer ${i + 1}`, `choice ${i + 1}`, `option ${i + 1}`),
  );
  const answerCol = col('answer', 'correct', 'correct answer', 'correct answers', 'key');
  if (!original && (letterCols[0] < 0 || letterCols[1] < 0)) return fail('Add answer columns named A, B, C (and optionally D).');
  if (answerCol < 0) return fail('Add an “answer” column saying which choice is right.');

  rows.slice(1).forEach((row, i) => {
    const line = headerAt + i + 2;
    const cell = (index: number) => (index >= 0 ? (row[index] ?? '').trim() : '');
    const prompt = cell(questionCol);
    // Blank rows in a template (numbered but never filled in) are not mistakes.
    if (!prompt && [answerCol, ...letterCols].every((index) => !cell(index))) return;
    if (!prompt) {
      errors.push(`Row ${line}: the question is blank.`);
      return;
    }
    let choices: string[];
    if (original) {
      try {
        const parsed = JSON.parse(cell(choicesCol));
        choices = Array.isArray(parsed) ? parsed.map((c) => String(c).trim()) : [];
      } catch {
        errors.push(`Row ${line}: “choices” must be a list like ["8","-8","20"].`);
        return;
      }
    } else {
      choices = letterCols.map(cell).filter((value, index) => value !== '' || index < 2);
      while (choices.length > 2 && choices[choices.length - 1] === '') choices.pop();
    }
    if (choices.length < 2 || choices.length > 4 || choices.some((c) => c === '')) {
      errors.push(`Row ${line}: give 2 to 4 answer choices.`);
      return;
    }
    if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) {
      errors.push(`Row ${line}: two answer choices are the same.`);
      return;
    }
    let key = cell(answerCol);
    const several = key.match(/^([1-4])(\s*[,;]\s*[1-4])+$/);
    if (several) {
      key = several[1];
      notes.push(`Row ${line}: more than one answer was marked right; kept answer ${key} (${choices[Number(key) - 1] ?? '?'}).`);
    }
    let correct = -1;
    if (original && /^\d+$/.test(key)) correct = Number(key);
    else if (/^[a-d]$/i.test(key)) correct = key.toUpperCase().charCodeAt(0) - 65;
    else if (/^[1-4]$/.test(key)) correct = Number(key) - 1;
    else correct = choices.findIndex((c) => c.toLowerCase() === key.toLowerCase());
    if (correct < 0 || correct >= choices.length) {
      errors.push(`Row ${line}: the answer “${key}” doesn’t match a choice. Use a letter like B.`);
      return;
    }
    add(
      cell(titleCol) || fallbackTitle,
      { id: randomId(), prompt, choices, correct, explanation: cell(explanationCol) || undefined },
      cell(subjectCol) || undefined,
      cell(gradeCol) || undefined,
    );
  });

  const sets = [...groups].map(([title, group]) => ({
    id: randomId(),
    title,
    subject: group.subject,
    grade: group.grade,
    questions: group.questions,
    updatedAt: Date.now(),
  }));
  return { sets, errors, notes };
}

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * One or more sets as a spreadsheet. The set title, subject and grade ride
 * along on every row, so importing the file gives back the same sets.
 */
export function exportCsv(sets: QuestionSet | QuestionSet[]): string {
  const header = ['set title', 'subject', 'grade', 'question', 'A', 'B', 'C', 'D', 'answer', 'explanation'];
  const lines = [sets].flat().flatMap((set) =>
    set.questions.map((q) =>
      [
        set.title,
        set.subject ?? '',
        set.grade ?? '',
        q.prompt,
        q.choices[0] ?? '',
        q.choices[1] ?? '',
        q.choices[2] ?? '',
        q.choices[3] ?? '',
        String.fromCharCode(65 + q.correct),
        q.explanation ?? '',
      ]
        .map(csvCell)
        .join(','),
    ),
  );
  return [header.join(','), ...lines].join('\n') + '\n';
}

export function csvFileName(title: string): string {
  return `${title.replace(/[^\w -]+/g, '').trim() || 'questions'}.csv`;
}

/** Saves text as a CSV file. The byte-order mark makes Excel read accents and symbols correctly. */
export function downloadCsv(name: string, text: string) {
  const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export const templateCsv = [
  'question,A,B,C,D,answer,explanation',
  'What is 7 × 8?,54,56,64,,B,Seven eights are fifty-six.',
  'Which planet is closest to the Sun?,Venus,Earth,Mercury,Mars,C,Mercury orbits closest to the Sun.',
  'A synonym for “happy” is…,joyful,angry,tired,,A,',
].join('\n') + '\n';

/** For a teacher to paste into an AI chat with a worksheet or PDF, so the reply pastes straight into the importer. */
export const aiInstructions = `Turn the attached material into a multiple-choice question set for Class Gauntlet, a classroom review game.

Reply with only a CSV inside one code block, with this exact header row:
question,A,B,C,D,answer,explanation

Rules:
- One question per row. Keep each question short enough to read aloud.
- Give 2 to 4 answer choices in columns A–D. Leave D (or C and D) empty if there are fewer choices. No two choices in a row may be the same.
- "answer" is the letter (A, B, C or D) of the one correct choice. Exactly one choice must be correct.
- "explanation" is optional: one short sentence on why the answer is right.
- Wrap any cell that contains a comma or a quotation mark in double quotes, and double any quotation marks inside it ("like ""this"""). Don't put line breaks inside cells.
- Write math with plain characters such as − × ÷ ² √ π ≤ ≥, not LaTeX.
- Only include questions that are already multiple choice, with their answer choices as written. True/false questions count: use True and False as choices A and B. Skip every other kind of question (short answer, fill in the blank, essay, matching) instead of converting it.
- Don't number the questions and don't add any other columns or text.

Example:
question,A,B,C,D,answer,explanation
What is 7 × 8?,54,56,64,,B,Seven eights are fifty-six.
"Which is a mammal: shark, whale, or trout?",Shark,Whale,Trout,,B,Whales breathe air and feed their young milk.
`;
