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
 * Commas or tabs both work, so cells pasted straight from Google Sheets or
 * Excel import too.
 */

export function parseDelimited(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/\t/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? '\t' : ',';
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

const norm = (header: string) => header.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export type ImportResult = { sets: QuestionSet[]; errors: string[] };

export function importQuestions(text: string, fallbackTitle = 'Imported questions'): ImportResult {
  const rows = parseDelimited(text.replace(/^﻿/, ''));
  if (rows.length < 2) return { sets: [], errors: ['The file needs a header row and at least one question.'] };
  const headers = rows[0].map(norm);
  const col = (...names: string[]) => headers.findIndex((h) => names.includes(h));
  const errors: string[] = [];
  const groups = new Map<string, { subject?: string; grade?: string; questions: Question[] }>();
  const add = (title: string, question: Question, subject?: string, grade?: string) => {
    const group = groups.get(title) ?? { subject, grade, questions: [] };
    group.questions.push(question);
    groups.set(title, group);
  };

  const questionCol = col('question', 'prompt', 'q');
  const explanationCol = col('explanation', 'why', 'reason', 'feedback');
  const titleCol = col('set title', 'set', 'title');
  const subjectCol = col('subject');
  const gradeCol = col('grade');
  if (questionCol < 0) return { sets: [], errors: ['Add a “question” column to the header row.'] };

  const choicesCol = col('choices');
  const original = choicesCol >= 0;
  const letterCols = ['a', 'b', 'c', 'd'].map((letter) =>
    col(letter, `choice ${letter}`, `option ${letter}`, `answer ${letter}`),
  );
  const answerCol = col('answer', 'correct', 'correct answer', 'key');
  if (!original && (letterCols[0] < 0 || letterCols[1] < 0))
    return { sets: [], errors: ['Add answer columns named A, B, C (and optionally D).'] };
  if (answerCol < 0) return { sets: [], errors: ['Add an “answer” column saying which choice is right.'] };

  rows.slice(1).forEach((row, i) => {
    const line = i + 2;
    const cell = (index: number) => (index >= 0 ? (row[index] ?? '').trim() : '');
    const prompt = cell(questionCol);
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
    const key = cell(answerCol);
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
  return { sets, errors };
}

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function exportCsv(set: QuestionSet): string {
  const header = ['question', 'A', 'B', 'C', 'D', 'answer', 'explanation'];
  const lines = set.questions.map((q) =>
    [q.prompt, q.choices[0] ?? '', q.choices[1] ?? '', q.choices[2] ?? '', q.choices[3] ?? '', String.fromCharCode(65 + q.correct), q.explanation ?? '']
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n') + '\n';
}

export const templateCsv = [
  'question,A,B,C,D,answer,explanation',
  'What is 7 × 8?,54,56,64,,B,Seven eights are fifty-six.',
  'Which planet is closest to the Sun?,Venus,Earth,Mercury,Mars,C,Mercury orbits closest to the Sun.',
  'A synonym for “happy” is…,joyful,angry,tired,,A,',
].join('\n') + '\n';
