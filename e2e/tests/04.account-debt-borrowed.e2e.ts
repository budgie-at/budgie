import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('04 account debt borrowed', { tags: ['accounts'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;

    await budgie.start({ fixture: '04.db' });

    await b.phase('create debt account', async () => {
        await a.createDebtAccount(ctx, {
            name: 'E2E Borrowed Account',
            currency: 'CHF',
            currentBalance: '0',
            debtType: 'BORROW',
            targetBalance: '800'
        });
        await b.expectText(ctx, /^you owe$/i, 10_000);
        await b.expectId(ctx, 'DebtAccountCardSummary.OutstandingAmount.E2E_Borrowed_Account.800');
        await b.expectId(ctx, 'DebtAccountCardSummary.TotalAmount.E2E_Borrowed_Account.800');
        await b.expectId(ctx, 'DebtAccountCardRing.Percentage.E2E_Borrowed_Account.0');
    });

    await b.phase('exercise debt account', () =>
        a.exerciseDebtAccount(ctx, {
            name: 'E2E Borrowed Account',
            currency: 'CHF',
            updatedName: 'E2E Borrowed CHF',
            returnDay: '18',
            returnDateLabel: /18,/,
            increaseTo: '300',
            increaseOutstanding: '500',
            decreaseTo: '175',
            decreaseOutstanding: '625',
            netWorthWhenIncluded: '_625'
        })
    );

    await b.phase('funded debt account', async () => {
        await a.createLiabilityAccount(ctx, { typeId: 'CreateAccount.CASH', name: 'E2E Borrowed Funding', currency: 'CHF', amount: '300' });
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Borrowed_Funding.300');
        await a.createDebtAccount(ctx, {
            name: 'E2E Borrowed To Cash',
            currency: 'CHF',
            currentBalance: '0',
            debtType: 'BORROW',
            targetBalance: '200',
            fundingAccount: 'E2E Borrowed Funding',
            fundingAccountId: 'E2E_Borrowed_Funding'
        });
        await b.expectId(ctx, 'DebtAccountCardSummary.OutstandingAmount.E2E_Borrowed_To_Cash.200');
        await b.expectId(ctx, 'DebtAccountCardSummary.TotalAmount.E2E_Borrowed_To_Cash.200');
        await b.scrollTo(ctx, 'AccountCard.Balance.E2E_Borrowed_Funding.500', 'up');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Borrowed_Funding.500');
    });

    await b.phase('funding transfer', async () => {
        await a.openAccountDetails(ctx, 'E2E Borrowed Funding');
        await b.expectId(ctx, 'TransactionCard.Category.Borrowing');
        await a.exitAccountDetailsToHome(ctx);
        await a.openAccountDetails(ctx, 'E2E Borrowed To Cash');
        await b.expectId(ctx, 'DebtAccountBalance.OutstandingAmount.200');
        await b.expectId(ctx, 'DebtAccountBalance.PaidAmount.0');
        await b.expectId(ctx, 'DebtAccountBalance.TotalAmount.200');
        await expect(b.byId(screen, 'TransactionCard.Label.E2E_Borrowed_To_Cash')).toHaveText(/, To E2E Borrowed Funding,/);
    });
});
