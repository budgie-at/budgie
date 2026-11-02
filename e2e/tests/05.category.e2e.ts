// Port of tests/app-tests/flows/05.category.flow.yaml.
import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as c from '../support/budgie/categories.ts';
import { test } from '../support/budgie/test.ts';

test('05 category', { tags: ['categories'] }, async ({ budgie }) => {
  const ctx = budgie.ctx;
  const { screen } = ctx;
  const id = (testId: string) => b.byId(screen, testId);
  const nameAndSubmit = async (name: string, clear = false) => {
    const input = id('CategoryForm.Input');
    await input.tap();
    if (clear) await input.clear();
    await input.fill(name);
    try {
      await input.press('Enter');
    } catch (cause) {
      // A press the device does not acknowledge in time has usually been delivered; the form's state is checked next.
      console.log(`[retry] Enter on the name field: ${(cause as Error).message.split('\n')[0]}`);
    }
    await b.tapId(ctx, 'CategoryForm.Submit');
  };
  const newCategory = async (query: string, icon: string, name: string) => {
    await b.tapId(ctx, 'ActionButton');
    await b.tapText(ctx, 'Category');
    await c.pickIcon(ctx, query, icon);
    await nameAndSubmit(name);
    await b.expectId(ctx, `CategoryCard.${name}`);
    await b.expectId(ctx, `CategoryCard.Icon.${name}.${icon}`);
  };

  await budgie.start({ fixture: '05.db' });
  await b.phase('open categories', async () => {
    await a.navigateToSettings(ctx);
    await a.openSettingsCard(ctx, 'SettingsPage.ManageCategoriesCard', 'CategoryPage.SearchInput');
  });

  await b.phase('create primary category with icon', () => newCategory('bike', 'reicon:Bicycle', 'E2E Category Primary'));
  await b.phase('create second category for search', () => newCategory('home', 'reicon:Home', 'E2E Category Search'));

  await b.phase('search and open result', async () => {
    await b.fillId(ctx, 'CategoryPage.SearchInput', 'Search');
    await b.expectId(ctx, 'CategoryCard.E2E Category Search');
    await b.expectNoId(ctx, 'CategoryCard.E2E Category Primary');
    await b.tapId(ctx, 'CategoryCard.E2E Category Search');
    await b.expectText(ctx, /^E2E Category Search/i);
    await b.tapId(ctx, 'CategoryForm.Delete');
    await screen.getByText('Delete').last().tap();
    await b.expectNoId(ctx, 'CategoryForm.Delete', 10_000);
    await b.expectNoId(ctx, 'CategoryCard.E2E Category Search');
    await id('CategoryPage.SearchInput').clear();
    await b.expectId(ctx, 'CategoryCard.E2E Category Primary');
    await b.expectNoId(ctx, 'CategoryCard.E2E Category Search');
  });

  await b.phase('edit primary category text + icon', async () => {
    await b.tapId(ctx, 'CategoryCard.E2E Category Primary');
    await c.pickIcon(ctx, 'heart', 'reicon:Heart');
    await nameAndSubmit('E2E Category Updated', true);
    await b.expectId(ctx, 'CategoryCard.E2E Category Updated');
    await b.expectId(ctx, 'CategoryCard.Icon.E2E Category Updated.reicon:Heart');
    await b.expectNoId(ctx, 'CategoryCard.E2E Category Primary');
    await c.swipeRowToDelete(ctx, 'CategoryCard.E2E Category Updated');
    await screen.getByText('Delete').last().tap();
    await b.expectNoId(ctx, 'CategoryCard.E2E Category Updated', 10_000);
  });
});
