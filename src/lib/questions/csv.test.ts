import { expect, test } from 'bun:test';
import { aiInstructions, exportCsv, importQuestions, templateCsv } from './csv';

test('imports the simple template and round-trips through export', () => {
  const { sets, errors } = importQuestions(templateCsv, 'Mine');
  expect(errors).toEqual([]);
  expect(sets[0].questions.map((q) => [q.choices.length, q.correct])).toEqual([[3, 1], [4, 2], [3, 0]]);
  const again = importQuestions(exportCsv(sets[0]), 'Mine');
  expect(again.sets[0].questions.map((q) => q.prompt)).toEqual(sets[0].questions.map((q) => q.prompt));
});

test('imports the original format, grouped by set title', () => {
  const csv = [
    'set title,subject,grade,question,choices,correct,explanation',
    'Integers,Math,7,What is 9 minus 15?,"[""6"",""-6"",""-24""]",1,Because.',
    'Ratios,Math,7,Which ratio is equivalent to 4 to 6?,"[""2 to 3"",""3 to 2"",""8 to 10""]",0,',
  ].join('\n');
  const { sets, errors } = importQuestions(csv);
  expect(errors).toEqual([]);
  expect(sets.map((s) => s.title)).toEqual(['Integers', 'Ratios']);
  expect(sets[0].questions[0].correct).toBe(1);
});

test('tab-separated paste, answer given as text, and row errors', () => {
  const tsv = 'Question\tA\tB\tC\tAnswer\nCapital of France?\tParis\tRome\tOslo\tparis\nBad row\tx\tx\t\tA\n';
  const { sets, errors } = importQuestions(tsv);
  expect(sets[0].questions[0].correct).toBe(0);
  expect(errors.length).toBe(1);
});

test('exporting several sets keeps titles, subjects and grades on re-import', () => {
  const [first] = importQuestions(templateCsv, 'Facts').sets;
  const second = { ...first, id: 'b', title: 'Second, with comma', subject: 'Science', grade: '5' };
  const { sets, errors } = importQuestions(exportCsv([first, second]));
  expect(errors).toEqual([]);
  expect(sets.map((s) => [s.title, s.subject, s.grade, s.questions.length])).toEqual([
    ['Facts', undefined, undefined, 3],
    ['Second, with comma', 'Science', '5', 3],
  ]);
  expect(sets[1].questions.map((q) => [q.choices, q.correct, q.explanation])).toEqual(
    first.questions.map((q) => [q.choices, q.correct, q.explanation]),
  );
});

test('imports Blooket’s spreadsheet template', () => {
  const csv = [
    '"Blooket\nImport Template",,,,,,,',
    'Question #,Question Text,Answer 1,Answer 2,"Answer 3\n(Optional)","Answer 4\n(Optional)","Time Limit (sec)\n(Max: 300 seconds)","Correct Answer(s)\n(Only include Answer #)"',
    '1,What is 2 + 2?,3,4,5,,20,2',
    '2,Pick a prime,4,6,7,9,20,"3,4"',
    '3,,,,,,20,',
  ].join('\n');
  const { sets, errors, notes } = importQuestions(csv, 'Blooket set');
  expect(errors).toEqual([]);
  expect(sets[0].title).toBe('Blooket set');
  expect(sets[0].questions.map((q) => [q.prompt, q.choices, q.correct])).toEqual([
    ['What is 2 + 2?', ['3', '4', '5'], 1],
    ['Pick a prime', ['4', '6', '7', '9'], 2],
  ]);
  expect(notes.length).toBe(1);
});

test('the AI instructions’ example imports cleanly', () => {
  const example = aiInstructions.slice(aiInstructions.indexOf('Example:\n') + 9);
  const { sets, errors } = importQuestions(example);
  expect(errors).toEqual([]);
  expect(sets[0].questions.map((q) => q.correct)).toEqual([1, 1]);
});
