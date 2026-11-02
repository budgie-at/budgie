// Port of tests/app-tests/flows/06.tag.flow.yaml.
import { expect } from 'e2e';
import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as c from '../support/budgie/categories.ts';
import { test } from '../support/budgie/test.ts';

test('06 tag', { tags: ['tags'] }, async ({ budgie }) => {
  const ctx = budgie.ctx;
  const { screen } = ctx;
  const id = (testId: string) => b.byId(screen, testId);
  const nameAndSubmit = async (name: string, clear = false) => {
    const input = id('TagForm.Input');
    await input.tap();
    if (clear) await input.clear();
    await input.fill(name);
    try {
      await input.press('Enter');
    } catch (cause) {
      // A press the device does not acknowledge in time has usually been delivered; the form's state is checked next.
      console.log(`[retry] Enter on the name field: ${(cause as Error).message.split('\n')[0]}`);
    }
    await b.tapId(ctx, 'TagForm.Submit');
  };
  const newTag = async (name: string) => {
    await b.tapId(ctx, 'ActionButton');
    await b.tapText(ctx, 'Tag');
    await nameAndSubmit(name);
    await b.expectId(ctx, `TagCard.${name}`);
  };

  await budgie.start({ fixture: '06.db' });
  await b.phase('open tags', async () => {
    await a.navigateToSettings(ctx);
    await a.openSettingsCard(ctx, 'SettingsPage.ManageTagsCard', 'TagPage.SearchInput');
  });

  await b.phase('create primary tag', () => newTag('E2E Tag Primary'));
  await b.phase('create second tag for search', () => newTag('E2E Tag Search'));

  await b.phase('search and open result', async () => {
    await b.fillId(ctx, 'TagPage.SearchInput', 'Search');
    await b.expectId(ctx, 'TagCard.E2E Tag Search');
    await b.expectNoId(ctx, 'TagCard.E2E Tag Primary');
    await b.tapId(ctx, 'TagCard.E2E Tag Search');
    await b.expectId(ctx, 'TagForm.Delete', 10_000);
    await b.tapId(ctx, 'TagForm.Delete');
    await screen.getByText('Delete').last().tap();
    await b.expectNoId(ctx, 'TagForm.Delete', 10_000);
    await b.expectNoId(ctx, 'TagCard.E2E Tag Search');
    await id('TagPage.SearchInput').clear();
    await b.expectId(ctx, 'TagCard.E2E Tag Primary');
    await b.expectNoId(ctx, 'TagCard.E2E Tag Search');
  });

  await b.phase('edit primary tag', async () => {
    await b.tapId(ctx, 'TagCard.E2E Tag Primary');
    await nameAndSubmit('E2E Tag Updated', true);
    await b.expectId(ctx, 'TagCard.E2E Tag Updated');
    await b.expectNoId(ctx, 'TagCard.E2E Tag Primary');
    await c.swipeRowToDelete(ctx, 'TagCard.E2E Tag Updated');
    await expect(screen.getByText(/^Delete .E2E Tag Updated.\?$/i).first()).toBeVisible();
    await screen.getByText('Delete').last().tap();
    await b.expectNoId(ctx, 'TagCard.E2E Tag Updated', 10_000);
  });
});
