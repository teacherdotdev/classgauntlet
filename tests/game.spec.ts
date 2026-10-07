import { expect, test, type Browser, type Page } from '@playwright/test';

async function joinAs(browser: Browser, code: string, nickname: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`/join?code=${code}`);
  await page.getByLabel('Nickname').fill(nickname);
  await page.getByRole('button', { name: 'Join the game' }).click();
  await expect(page.getByRole('heading', { name: 'You’re in!' })).toBeVisible({ timeout: 30_000 });
  return page;
}

test('a full game over peer-to-peer: join, answer, spotlight, lifeline, reveal, reconnect', async ({ browser }) => {
  const teacher = await (await browser.newContext()).newPage();
  await teacher.goto('/host');
  await teacher.getByRole('button', { name: 'Open the room' }).click();
  await expect(teacher.getByText('Room open')).toBeVisible({ timeout: 30_000 });
  const code = (await teacher.locator('strong.code').textContent())!.trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);

  const projector = await teacher.context().newPage();
  await projector.goto('/show');
  await expect(projector.getByText(code[0], { exact: true }).first()).toBeVisible();

  const ana = await joinAs(browser, code, 'Ana');
  const ben = await joinAs(browser, code, 'Ben');
  const cy = await joinAs(browser, code, 'Cy');
  await expect(teacher.getByRole('heading', { name: '3 students in the room' })).toBeVisible();

  // Ana is The One.
  await teacher.getByLabel('First Spotlight Player').selectOption({ label: 'Ana' });
  await teacher.getByRole('button', { name: 'Start the game' }).click();
  await expect(ana.getByRole('heading', { name: 'You’re in the Spotlight!' })).toBeVisible();
  await expect(ben.getByRole('heading', { name: 'Ana is in the Spotlight' })).toBeVisible();

  // Question 1 (sample: "What is negative 6 plus 14?", answer A = 8).
  await teacher.getByRole('button', { name: 'Open question 1' }).click();
  await expect(ana.getByRole('heading', { name: 'The class is answering' })).toBeVisible();
  await expect(ana.getByText('negative 6 plus 14')).toHaveCount(0);
  await expect(projector.getByText('Answer on your device!')).toBeVisible();
  await expect(projector.getByText('negative 6 plus 14')).toHaveCount(0);
  await ben.getByRole('button', { name: /^A\. 8/ }).click();
  await cy.getByRole('button', { name: /^B\. -8/ }).click();
  await expect(teacher.getByRole('heading', { name: 'Class answers locked' })).toBeVisible();

  await teacher.getByRole('button', { name: 'Show the question to Ana' }).click();
  await expect(projector.getByText('What is negative 6 plus 14?')).toBeVisible();
  await ana.getByRole('button', { name: /^A\. 8/ }).click();
  await ana.getByRole('button', { name: 'Final answer: A' }).click();
  await teacher.getByRole('button', { name: 'Reveal the answer' }).click();
  await expect(ana.getByText('You got it!')).toBeVisible();
  await expect(ben.getByText('Correct!')).toBeVisible();
  await expect(cy.getByText('You’re on the Comeback Crew now')).toBeVisible();
  await expect(projector.getByText('Cy joins the Comeback Crew')).toBeVisible();

  // Ben reloads mid-game and keeps his seat and points.
  await ben.reload();
  await expect(ben.locator('.me')).toContainText('Ben', { timeout: 30_000 });
  await expect(ben.locator('.stats')).toContainText('12');

  // Question 2 (answer B = -6): Ana polls the class.
  await teacher.getByRole('button', { name: /Next question/ }).click();
  await ben.getByRole('button', { name: /^B\. -6/ }).click();
  await cy.getByRole('button', { name: /^A\. 6/ }).click();
  await teacher.getByRole('button', { name: 'Show the question to Ana' }).click();
  await ana.getByRole('button', { name: /^B\. -6/ }).click();
  await ana.getByRole('button', { name: /Poll the Class/ }).click();
  await expect(ana.getByText('1 of 2 classmates chose B')).toBeVisible();
  await ana.getByRole('button', { name: 'Final answer: B' }).click();
  await teacher.getByRole('button', { name: 'Reveal the answer' }).click();

  // Ben is the last Challenge Team member and missed nothing; Ana is right again → game continues.
  await expect(teacher.getByRole('heading', { name: 'Ana got it!' })).toBeVisible();

  // The teacher reloads their tab: the game resumes and students reconnect.
  await teacher.reload();
  await teacher.getByRole('button', { name: 'Resume game' }).click();
  await expect(teacher.getByText('Room open')).toBeVisible({ timeout: 90_000 });
  await expect(teacher.locator('.roster li:not(.offline)')).toHaveCount(3, { timeout: 30_000 });
  await teacher.getByRole('button', { name: /Next question/ }).click();
  await expect(ben.getByText('Everybody answers')).toBeVisible({ timeout: 15_000 });

  await teacher.getByRole('button', { name: 'End session…' }).click();
  await teacher.getByRole('button', { name: 'End session' }).click();
  await expect(cy.getByRole('heading', { name: 'Final standings' })).toBeVisible();
});
