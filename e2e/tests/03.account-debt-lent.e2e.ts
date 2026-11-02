// Port of tests/app-tests/flows/03.account-debt-lent.flow.yaml.
import { expect } from 'e2e';
import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('03 account debt lent', { tags: ['accounts'] }, async ({ budgie }) => {
  const ctx = budgie.ctx;
  const { screen } = ctx;

  await budgie.start({ fixture: '03.db' });

  await b.phase('create debt account', async () => {
    await a.createDebtAccount(ctx, { name: 'E2E Lent Account', currency: 'GBP', currentBalance: '0', debtType: 'LENT', targetBalance: '1000' });
    await b.expectText(ctx, /^owed to you$/i, 10_000);
    await b.expectId(ctx, 'DebtAccountCardSummary.OutstandingAmount.E2E_Lent_Account.1000');
    await b.expectId(ctx, 'DebtAccountCardSummary.TotalAmount.E2E_Lent_Account.1000');
    await b.expectId(ctx, 'DebtAccountCardRing.Percentage.E2E_Lent_Account.0');
  });

  await b.phase('exercise debt account', () =>
    a.exerciseDebtAccount(ctx, {
      name: 'E2E Lent Account',
      currency: 'GBP',
      updatedName: 'E2E Lent GBP',
      returnDay: '15',
      returnDateLabel: /15,/,
      increaseTo: '400',
      increaseOutstanding: '600',
      decreaseTo: '250',
      decreaseOutstanding: '750',
      netWorthWhenIncluded: '750',
    }),
  );

  await b.phase('funded debt account', async () => {
    await a.createLiabilityAccount(ctx, { typeId: 'CreateAccount.CASH', name: 'E2E Lent Funding', currency: 'GBP', amount: '900' });
    await b.expectId(ctx, 'AccountCard.Balance.E2E_Lent_Funding.900');
    await a.createDebtAccount(ctx, {
      name: 'E2E Lent From Cash',
      currency: 'GBP',
      currentBalance: '0',
      debtType: 'LENT',
      targetBalance: '400',
      fundingAccount: 'E2E Lent Funding',
      fundingAccountId: 'E2E_Lent_Funding',
    });
    await b.expectId(ctx, 'DebtAccountCardSummary.OutstandingAmount.E2E_Lent_From_Cash.400');
    await b.expectId(ctx, 'DebtAccountCardSummary.TotalAmount.E2E_Lent_From_Cash.400');
    await b.scrollTo(ctx, 'AccountCard.Balance.E2E_Lent_Funding.500', 'up');
    await b.expectId(ctx, 'AccountCard.Balance.E2E_Lent_Funding.500');
  });

  await b.phase('funding transfer', async () => {
    await a.openAccountDetails(ctx, 'E2E Lent Funding');
    await b.expectId(ctx, 'TransactionCard.Category.Lending');
    await a.exitAccountDetailsToHome(ctx);
    await a.openAccountDetails(ctx, 'E2E Lent From Cash');
    await b.expectId(ctx, 'DebtAccountBalance.OutstandingAmount.400');
    await b.expectId(ctx, 'DebtAccountBalance.PaidAmount.0');
    await b.expectId(ctx, 'DebtAccountBalance.TotalAmount.400');
    await expect(b.byId(screen, 'TransactionCard.Label.E2E_Lent_From_Cash')).toHaveText(/, From E2E Lent Funding,/);
  });
});
