import { expect, test, type Browser } from '@playwright/test';

// Not a check: saves screenshots of each screen for a visual review. Run with SHOTS=dir.
const dir = process.env.SHOTS;
test.skip(!dir, 'set SHOTS to a folder to save screenshots');

async function phone(browser: Browser, code: string, name: string) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('/join?code=' + code);
  await page.getByLabel('Nickname').fill(name);
  await page.getByRole('button', { name: 'Join the game' }).click();
  await expect(page.getByRole('heading', { name: 'You’re in!' })).toBeVisible({ timeout: 30_000 });
  return page;
}

test('screens', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const t = await ctx.newPage();
  await t.goto('/');
  await t.getByRole('heading', { name: /nobody gets knocked out/ }).waitFor();
  await t.screenshot({ path: dir + '/01-home.png', fullPage: true });
  await t.goto('/questions');
  await t.getByRole('heading', { name: 'Your question sets' }).waitFor();
  await t.screenshot({ path: dir + '/02-questions.png', fullPage: true });
  await t.goto('/questions/edit?id=sample-grade7-math');
  await t.getByText('Question 1', { exact: true }).waitFor();
  await t.screenshot({ path: dir + '/03-editor.png' });
  await t.goto('/host');
  await t.getByRole('button', { name: 'Open the room' }).waitFor();
  await t.screenshot({ path: dir + '/04-host-setup.png', fullPage: true });
  await t.getByRole('button', { name: 'Open the room' }).click();
  await expect(t.getByText('Room open')).toBeVisible({ timeout: 30_000 });
  const code = (await t.locator('strong.code').textContent())!.trim();
  const proj = await ctx.newPage();
  await proj.goto('/show');
  const names = ['Ana', 'Ben', 'Cy', 'Dee', 'Eli'];
  const kids = [];
  for (const n of names) kids.push(await phone(browser, code, n));
  await proj.screenshot({ path: dir + '/05-proj-lobby.png' });
  await t.screenshot({ path: dir + '/06-host-lobby.png', fullPage: true });
  await kids[1].screenshot({ path: dir + '/07-phone-lobby.png' });
  await t.getByLabel('First Spotlight Player').selectOption({ label: 'Ana' });
  await t.getByRole('button', { name: 'Start the game' }).click();
  await proj.waitForTimeout(400);
  await proj.screenshot({ path: dir + '/08-proj-between.png' });
  await t.getByRole('button', { name: 'Open question 1' }).click();
  await kids[1].getByRole('button', { name: /^A\. 8/ }).click();
  await kids[2].getByRole('button', { name: /^B\. -8/ }).click();
  await proj.waitForTimeout(300);
  await proj.screenshot({ path: dir + '/09-proj-phaseA.png' });
  await kids[3].screenshot({ path: dir + '/10-phone-phaseA.png' });
  await kids[1].screenshot({ path: dir + '/10b-phone-answered.png' });
  await kids[0].screenshot({ path: dir + '/11-phone-one-waiting.png' });
  await t.screenshot({ path: dir + '/12-host-phaseA.png', fullPage: true });
  await kids[3].getByRole('button', { name: /^A\. 8/ }).click();
  await kids[4].getByRole('button', { name: /^C\. 20/ }).click();
  await t.getByRole('button', { name: 'Show the question to Ana' }).click();
  await kids[0].getByRole('button', { name: /^A\. 8/ }).click();
  await kids[0].screenshot({ path: dir + '/13-phone-one-phaseB.png', fullPage: true });
  await proj.screenshot({ path: dir + '/14-proj-phaseB.png' });
  await kids[0].getByRole('button', { name: /Ask Two/ }).click();
  await proj.waitForTimeout(300);
  await proj.screenshot({ path: dir + '/15-proj-ask.png' });
  await kids[0].getByRole('button', { name: 'Final answer: A' }).click();
  await t.getByRole('button', { name: 'Reveal the answer' }).click();
  await proj.waitForTimeout(500);
  await proj.screenshot({ path: dir + '/16-proj-reveal.png' });
  await kids[2].screenshot({ path: dir + '/17-phone-demoted.png', fullPage: true });
  await t.screenshot({ path: dir + '/18-host-reveal.png', fullPage: true });
  // Q2: Ana misses twice → flameout
  for (let i = 0; i < 2; i++) {
    await t.getByRole('button', { name: /Next question/ }).click();
    for (const k of kids.slice(1)) await k.locator('button.choice').nth(1).click();
    await t.getByRole('button', { name: 'Show the question to Ana' }).click();
    await kids[0].locator('button.choice').nth(0).click();
    await kids[0].getByRole('button', { name: 'Final answer: A' }).click();
    await t.getByRole('button', { name: 'Reveal the answer' }).click();
  }
  await proj.waitForTimeout(1500);
  await proj.screenshot({ path: dir + '/19-proj-gameover.png' });
  await t.getByRole('button', { name: 'Show the leaderboard' }).click();
  await proj.waitForTimeout(400);
  await proj.screenshot({ path: dir + '/20-proj-leaderboard.png' });
  await kids[1].screenshot({ path: dir + '/21-phone-leaderboard.png', fullPage: true });
  await t.getByRole('button', { name: 'End session…' }).click();
  await t.getByRole('button', { name: 'End session' }).click();
  await proj.waitForTimeout(400);
  await proj.screenshot({ path: dir + '/22-proj-final.png' });
});
