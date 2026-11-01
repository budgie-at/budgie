import { fileURLToPath } from 'node:url';
import { expect } from 'e2e';
import type { App, Screen } from 'e2e';
import type { Device } from '@e2e-dev/mobile';
import { leaseIdForUdid, prepareSimulator, seedDatabase, type SimlockApi } from './simlock-exec.ts';

/** The fixtures of the Maestro suite, shared, not copied. */
export const FIXTURES = fileURLToPath(new URL('../../tests/app-tests/fixtures/', import.meta.url));

export const BUNDLE_ID = 'com.vitalyiegorov.budgie.e2e';


export interface Ctx {
  readonly screen: Screen;
  readonly app: App;
  readonly device: Device;
}

const api = (): SimlockApi => ({ url: process.env.SIMLOCK_URL!, token: process.env.SIMLOCK_TOKEN! });

/** A React Native testID shows up on the host view and its wrapper; Maestro takes the first, so does this. */
export const byId = (screen: Screen, testId: string) => screen.getByTestId(testId).first();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Times a named phase; the totals land in the report through stdout. */
export async function phase<T>(name: string, body: () => Promise<T>): Promise<T> {
  const started = Date.now();
  try {
    return await body();
  } finally {
    console.log(`[phase] ${name} ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
}

/** Maestro's `tapOn: Done`: the keyboard's return key, else hide the keyboard. */
export async function done({ screen, device }: Ctx): Promise<void> {
  const key = screen.getByRole('button', { name: 'Done' });
  if (await key.first().isVisible()) await key.last().tap();
  else await device.dismissKeyboard();
}

/** Clears iOS's "Open in “budgie”?" prompt that the first custom-scheme link on a fresh simulator shows. */
async function acceptOpenInPrompt({ screen }: Ctx): Promise<void> {
  const prompt = screen.getByText(/^Open in /);
  if (await prompt.first().isVisible()) {
    await screen.getByText('Open').last().tap();
    await expect(prompt.first()).toBeHidden({ timeout: 3_000 });
  }
}

export async function openLink(ctx: Ctx, url: string): Promise<void> {
  await ctx.device.openLink(url);
  await sleep(500);
  await acceptOpenInPrompt(ctx);
}

/**
 * setup/setup-rules-test + import-database-from-settings with the database
 * seeded (`DATABASE_FIXTURE_SEEDED=true`), plus the shard's
 * `prime-deep-links` pre-run flow.
 */
export async function setupWithFixture(ctx: Ctx, fixture: string): Promise<void> {
  const { screen, app, device } = ctx;
  await phase('seed fixture over simlock exec', async () => {
    const lease = await leaseIdForUdid(api(), device.unstable_raw.deviceId);
    await prepareSimulator(api(), lease, BUNDLE_ID);
    await seedDatabase(api(), lease, BUNDLE_ID, `${FIXTURES}${fixture}`);
  });
  await phase('launch on the seeded database', async () => {
    await app.open();
    await expect(byId(screen, 'TabBar.Home')).toBeVisible({ timeout: 30_000 });
    if (!(await byId(screen, 'HomePage.TotalBalance').isVisible())) await byId(screen, 'TabBar.Home').tap();
    await expect(byId(screen, 'HomePage.TotalBalance')).toBeVisible({ timeout: 30_000 });
    await app.restart();
    await expect(byId(screen, 'TabBar.Home')).toBeVisible({ timeout: 30_000 });
  });
  await phase('prime deep links', async () => {
    await openLink(ctx, 'budgie://transactions');
    await expect(byId(screen, 'TransactionsPage.Container')).toBeVisible({ timeout: 10_000 });
  });
}

export async function navigateToRules(ctx: Ctx): Promise<void> {
  await openLink(ctx, 'budgie://settings/rules');
  await expect(byId(ctx.screen, 'RulesPage.Page')).toBeVisible({ timeout: 15_000 });
}

/** Maestro's `retryTapIfNoChange`: tap again when the expected next control does not show. */
export async function tapUntil(ctx: Ctx, target: string, next: () => Promise<void>): Promise<void> {
  await byId(ctx.screen, target).tap();
  try {
    await next();
  } catch {
    await byId(ctx.screen, target).tap();
    await next();
  }
}

/** subflows/rules/open-create-rule-form */
export async function openCreateRuleForm(ctx: Ctx): Promise<void> {
  const { screen } = ctx;
  await tapUntil(ctx, 'ActionButton', () => expect(byId(screen, 'RulesPage.CreateButton.Label')).toBeVisible({ timeout: 5_000 }));
  await tapUntil(ctx, 'RulesPage.CreateButton.Label', () => expect(screen.getByText('Create Rule').first()).toBeVisible({ timeout: 5_000 }));
}

/** subflows/shared/select-category-by-search */
export async function selectCategoryBySearch(ctx: Ctx, name: string): Promise<void> {
  const { screen } = ctx;
  const input = byId(screen, 'CategoryPickerBottomSheet.Input');
  await expect(input).toBeVisible();
  await input.fill(name);
  await done(ctx);
  const card = byId(screen, `CategoryPickerBottomSheet.Card.${name}.Label`);
  await expect(card).toBeVisible();
  await card.tap();
  await expect(input).toBeHidden({ timeout: 5_000 });
}

/** subflows/rules/submit-rule-skip-existing */
export async function submitRuleSkipExisting(ctx: Ctx): Promise<void> {
  const { screen } = ctx;
  await byId(screen, 'RuleForm.Footer.SubmitButton').tap();
  const ask = screen.getByText('Apply to existing transactions?');
  if (await ask.first().isVisible()) await screen.getByText('Skip').last().tap();
  else {
    await sleep(800);
    if (await ask.first().isVisible()) await screen.getByText('Skip').last().tap();
  }
  await expect(byId(screen, 'RulesPage.Page')).toBeVisible();
}

/** subflows/rules/submit-rule-apply-existing */
export async function submitRuleApplyExisting(ctx: Ctx): Promise<void> {
  const { screen } = ctx;
  await byId(screen, 'RuleForm.Footer.SubmitButton').tap();
  await expect(screen.getByText('Apply to existing transactions?').first()).toBeVisible();
  await screen.getByText('Apply').last().tap();
  await expect(byId(screen, 'RulesPage.Page')).toBeVisible();
  await expect(screen.getByText('Rule applied').first()).toBeVisible({ timeout: 15_000 });
}

/** subflows/rules/delete-first-rule: swipe the first card left, tap its delete action, confirm. */
export async function deleteFirstRule(ctx: Ctx): Promise<void> {
  const { screen } = ctx;
  const card = byId(screen, 'RulesPage.RuleCard.0');
  const action = byId(screen, 'DeletableRow.DeleteButton');
  for (let attempt = 1; ; attempt++) {
    await sleep(600);
    const box = await card.boundingBox();
    if (box === null) throw new Error('RulesPage.RuleCard.0 has no bounds');
    const y = box.y + box.height / 2;
    await screen.swipe({ from: { x: box.x + box.width / 2, y }, to: { x: box.x + 8, y }, duration: 300 });
    try {
      await expect(action).toBeVisible({ timeout: 3_000 });
      break;
    } catch (cause) {
      if (attempt === 3) throw cause;
      console.log(`[retry] swipe-to-delete attempt ${attempt} revealed no delete action`);
    }
  }
  await action.tap();
  await expect(screen.getByText('Delete this rule?').first()).toBeVisible();
  await screen.getByText('Delete').last().tap();
  await expect(screen.getByText('Delete this rule?').first()).toBeHidden();
}

/** The `[ assertVisible card, conditions, actions ]` triple the flow repeats after each save. */
export async function expectRuleCard(ctx: Ctx, index = 0, full = true): Promise<void> {
  await expect(byId(ctx.screen, `RulesPage.RuleCard.${index}`)).toBeVisible();
  if (!full) return;
  await expect(byId(ctx.screen, `RulesPage.RuleCardConditions.${index}`)).toBeVisible();
  await expect(byId(ctx.screen, `RulesPage.RuleCardActions.${index}`)).toBeVisible();
}

export async function expectEmpty(ctx: Ctx): Promise<void> {
  await expect(byId(ctx.screen, 'RulesPage.EmptyState')).toBeVisible();
}

export async function scrollTo(ctx: Ctx, testId: string, direction: 'up' | 'down' = 'down'): Promise<void> {
  await ctx.screen.scrollUntilVisible(byId(ctx.screen, testId), { direction, timeout: 20_000 });
}

export async function tapId(ctx: Ctx, testId: string): Promise<void> {
  await byId(ctx.screen, testId).tap();
}

export async function fillId(ctx: Ctx, testId: string, text: string): Promise<void> {
  await byId(ctx.screen, testId).fill(text);
}

/** Picks an option card of the rule form's selector sheet: field, operator, action type, source. */
export async function pick(ctx: Ctx, opener: string, option: string): Promise<void> {
  await tapId(ctx, opener);
  const card = byId(ctx.screen, `RuleForm.SelectorCard.${option}`);
  await expect(card).toBeVisible();
  await card.tap();
  await expect(card).toBeHidden();
}
