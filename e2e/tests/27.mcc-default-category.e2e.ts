// Port of tests/app-tests/flows/27.mcc-default-category.flow.yaml.
import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as i from '../support/budgie/imports.ts';
import * as s from '../support/budgie/settings.ts';
import { test } from '../support/budgie/test.ts';

test('27 mcc default category', { tags: ['import'] }, async ({ budgie }) => {
  const ctx = budgie.ctx;
  await budgie.start({ fixture: '19.db' });

  await b.phase('auto-assign mcc setting is shown', async () => {
    await s.openSettingsAnchor(ctx, 'general');
    await b.scrollTo(ctx, 'SettingsPage.AutoAssignMccCategorySwitch');
    await b.expectId(ctx, 'SettingsPage.AutoAssignMccCategorySwitch');
  });

  await b.phase('import mcc csv', async () => {
    await i.importTestTransactions(ctx, await budgie.csvFixturesUri(), 'e2e-mcc-default-category', 'TransactionCard.Label.E2E_MCC_No_Code');
    await b.tapId(ctx, 'TabBar.Home');
    await b.expectId(ctx, 'TabBar.Home', 10_000);
  });

  await b.phase('mcc categories assigned', async () => {
    await a.openAccountDetails(ctx, 'e2e csv wallet USD');
    await b.expectId(ctx, 'UncategorizedTransactionsPill.Button');
    await b.scrollTo(ctx, 'TransactionCard.Label.E2E_MCC_No_Code');
    await b.expectNoId(ctx, 'TransactionCard.Category.Other');
    for (const [label, category] of [
      ['Pharmacy', 'Health_Medical'],
      ['Fuel', 'Car_Fuel'],
      ['Restaurant', 'Restaurants_Cafes'],
      ['Groceries', 'Groceries'],
    ] as const) {
      await b.scrollTo(ctx, `TransactionCard.Label.E2E_MCC_${label}`);
      await b.expectId(ctx, `TransactionCard.Category.${category}`, 3_000);
    }
  });
});
