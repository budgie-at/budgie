import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import * as m from '../support/budgie/misc.ts';
import * as s from '../support/budgie/settings.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const ALL = [
    'E2E_Filter_Expense',
    'E2E_Filter_Income',
    'E2E_Filter_Transfer',
    'E2E_Native_Amount_Transfer',
    'E2E_Missing_Rate_Expense'
] as const;

test('14 transaction filters', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const shown = async (...labels: string[]) => {
        for (const label of labels) {
            await b.expectId(ctx, `TransactionCard.Label.${label}`);
        }
    };
    const hidden = async (...labels: string[]) => {
        for (const label of labels) {
            await b.expectNoId(ctx, `TransactionCard.Label.${label}`);
        }
    };
    const counter = (text: string, timeout?: number) =>
        expect(id('TransactionsPage.TransactionCount')).toHaveText(text, timeout === undefined ? undefined : { timeout });
    const typeFilter = async (type: 'EXPENSE' | 'INCOME') => {
        await b.tapId(ctx, 'TransactionFilters.TypeChip');
        await b.tapId(ctx, `TransactionFilters.TypeOption.${type}`);
        await b.tapId(ctx, 'TransactionFilters.TypeApplyButton');
    };
    const amountFilter = async (from: string, to: string, check?: () => Promise<void>) => {
        await b.tapId(ctx, 'TransactionFilters.AmountChip');
        await b.expectId(ctx, 'TransactionFilters.AmountFromInput', 3_000);
        await b.fillId(ctx, 'TransactionFilters.AmountFromInput', from);
        await b.fillId(ctx, 'TransactionFilters.AmountToInput', to);
        await check?.();
        await b.tapId(ctx, 'TransactionFilters.AmountApplyButton');
    };
    const dateFilter = async (chip: 'DateChip' | 'DateChipActive', period: 'TODAY' | 'ALL_TIME') => {
        await b.tapId(ctx, `TransactionFilters.${chip}`);
        await b.tapId(ctx, `TransactionFilters.DatePeriod.${period}`);
        await b.tapId(ctx, 'TransactionFilters.DateApplyButton');
    };
    const back = async (to: string) => {
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, to, 5_000);
    };
    const clearAll = () => b.tapId(ctx, 'TransactionFilters.ClearAllButton');

    await budgie.start({ fixture: '14.db' });

    await b.phase('money data upgrade, list', async () => {
        await s.runMoneyDataUpgrade(ctx);
        await t.navigateToTransactions(ctx);
        await shown(...ALL);
        await counter('9 transactions');
    });

    await b.phase('type filter: expense', async () => {
        await typeFilter('EXPENSE');
        await shown('E2E_Filter_Expense', 'E2E_Missing_Rate_Expense');
        await hidden('E2E_Filter_Income', 'E2E_Filter_Transfer');
        await counter('4 transactions');
        await typeFilter('EXPENSE');
    });

    await b.phase('type filter: income, uncategorized inbox', async () => {
        await typeFilter('INCOME');
        await shown('E2E_Filter_Income');
        await hidden('E2E_Filter_Expense', 'E2E_Filter_Transfer');
        await b.expectId(ctx, 'UncategorizedTransactionsPill.Button');
        await expect(id('UncategorizedTransactionsPill.Button')).toHaveText('2 uncategorized');
        await b.tapId(ctx, 'UncategorizedTransactionsPill.Button');
        await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton');
        await b.tapId(ctx, 'CategorizeInboxPage.ShowListButton');
        await b.expectText(ctx, 'Missing categories');
        await b.expectText(ctx, 'Income');
        await shown('E2E_Uncategorized_Income');
        await hidden('E2E_Filter_Income');
        await back('CategorizeInboxPage.ShowListButton');
        await back('TransactionCard.Label.E2E_Filter_Income');
        await typeFilter('INCOME');
    });

    await b.phase('account filter', async () => {
        await m.revealChip(ctx, 'TransactionFilters.CategoryChip', 'TransactionFilters.AccountChip', 'right');
        await b.expectId(ctx, 'TransactionFilters.AccountChip');
        await b.tapId(ctx, 'TransactionFilters.AccountChip');
        await b.expectId(ctx, 'TransactionFilters.AccountOption.E2E Filter Cash A', 5_000);
        await b.tapId(ctx, 'TransactionFilters.AccountOption.E2E Filter Cash A');
        await b.expectId(ctx, 'TransactionFilters.AccountApplyButton', 5_000);
        await expect(id('TransactionFilters.AccountApplyButton')).toHaveText('Show 1 account');
        await b.tapId(ctx, 'TransactionFilters.AccountApplyButton');
        await shown('E2E_Filter_Expense', 'E2E_Filter_Transfer', 'E2E_Native_Amount_Transfer');
        await hidden('E2E_Filter_Income');
        await counter('3 transactions');
        await m.revealChip(ctx, 'TransactionFilters.AmountChip', 'TransactionFilters.ClearAllButton', 'left');
        await b.expectId(ctx, 'TransactionFilters.ClearAllButton');
        await clearAll();
        await shown('E2E_Filter_Expense', 'E2E_Filter_Income', 'E2E_Filter_Transfer', 'E2E_Missing_Rate_Expense');
    });

    await b.phase('amount filter 20..30', async () => {
        await amountFilter('20', '30', async () => {
            await expect(id('TransactionFilters.AmountFromInput')).toHaveValue('20');
            await expect(id('TransactionFilters.AmountToInput')).toHaveValue('30');
        });
        await shown('E2E_Filter_Expense', 'E2E_Native_Amount_Transfer');
        await hidden('E2E_Filter_Income', 'E2E_Filter_Transfer');
        await counter('2 transactions');
        await clearAll();
        await shown(...ALL);
    });

    await b.phase('amount filter 13..13: empty state', async () => {
        await amountFilter('13', '13');
        await hidden('E2E_Native_Amount_Transfer');
        await b.expectId(ctx, 'TransactionsPage.EmptyState');
        await b.tapId(ctx, 'TransactionsPage.ClearFiltersButton');
        await shown(...ALL);
    });

    await b.phase('amount filter 500..1000', async () => {
        await amountFilter('500', '1000', () => expect(id('TransactionFilters.AmountToInput')).toHaveValue('1000'));
        await shown('E2E_Native_Amount_Transfer');
        await hidden('E2E_Filter_Expense', 'E2E_Filter_Income', 'E2E_Filter_Transfer', 'E2E_Missing_Rate_Expense');
        await counter('1 transaction');
        await clearAll();
        await shown(
            'E2E_Filter_Expense',
            'E2E_Filter_Income',
            'E2E_Filter_Transfer',
            'E2E_Missing_Rate_Expense',
            'E2E_Native_Amount_Transfer'
        );
        await counter('9 transactions');
    });

    await b.phase('amount filter 50..100: uncategorized inbox', async () => {
        await amountFilter('50', '100');
        await screen.scrollUntilVisible(id('UncategorizedTransactionsPill.Button'), { direction: 'left', timeout: 20_000 });
        await expect(id('UncategorizedTransactionsPill.Button')).toHaveText('1 uncategorized');
        await b.tapId(ctx, 'UncategorizedTransactionsPill.Button');
        await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton', 5_000);
        await b.tapId(ctx, 'CategorizeInboxPage.ShowListButton');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Uncategorized_Large_Income', 5_000);
        await hidden('E2E_Uncategorized_Income');
        await back('CategorizeInboxPage.ShowListButton');
        await back('TransactionFilters.ClearAllButton');
        await clearAll();
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Filter_Income', 5_000);
    });

    await b.phase('category and tag filters', async () => {
        await m.revealChip(ctx, 'TransactionFilters.AmountChip', 'TransactionFilters.CategoryChip', 'right');
        await c.applyCategoryFilter(ctx, 'E2E Filter Income Category');
        await shown('E2E_Filter_Income');
        await hidden('E2E_Filter_Expense', 'E2E_Filter_Transfer');
        await m.revealChip(ctx, 'TransactionFilters.AmountChip', 'TransactionFilters.CategoryChip', 'right');
        await b.expectId(ctx, 'TransactionFilters.CategoryChip');
        await c.applyCategoryFilter(ctx, 'E2E Filter Income Category');
        await m.revealChip(ctx, 'TransactionFilters.CategoryChip', 'TransactionFilters.TagChip', 'right');
        await b.tapId(ctx, 'TransactionFilters.TagChip');
        await b.expectId(ctx, 'TransactionFilters.TagSearchInput', 5_000);
        await b.fillId(ctx, 'TransactionFilters.TagSearchInput', 'Expense Tag');
        await id('TransactionFilters.TagSearchInput').press('Enter');
        await b.expectId(ctx, 'TagPickerBottomSheet.Card.E2E Filter Expense Tag', 5_000);
        await b.tapId(ctx, 'TagPickerBottomSheet.Card.E2E Filter Expense Tag');
        await b.tapId(ctx, 'TransactionFilters.TagApplyButton');
        await shown('E2E_Filter_Expense');
        await hidden('E2E_Filter_Income', 'E2E_Filter_Transfer');
        await counter('1 transaction');
        await m.revealChip(ctx, 'TransactionFilters.AmountChip', 'TransactionFilters.ClearAllButton', 'left');
        await b.expectId(ctx, 'TransactionFilters.ClearAllButton');
        await clearAll();
        await shown('E2E_Filter_Expense', 'E2E_Filter_Income', 'E2E_Filter_Transfer');
    });

    await b.phase('date filter: today', async () => {
        await t.openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        await b.tapId(ctx, 'TransactionKeypad.Digit.5');
        await t.selectAccount(ctx, 'E2E Filter Cash A');
        await c.selectCategory(ctx, 'E2E Filter Expense Category');
        await t.selectExistingTag(ctx, 'E2E Filter Expense Tag');
        await t.enterComment(ctx, 'E2E Date Today Expense');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Date_Today_Expense', 5_000);
        await m.revealChip(ctx, 'TransactionFilters.TypeChip', 'TransactionFilters.DateChip', 'left');
        await dateFilter('DateChip', 'TODAY');
        await shown('E2E_Date_Today_Expense');
        await hidden('E2E_Filter_Expense', 'E2E_Filter_Income', 'E2E_Filter_Transfer');
        await clearAll();
        await shown('E2E_Date_Today_Expense');
        await b.scrollTo(ctx, 'TransactionCard.Label.E2E_Filter_Expense');
        await shown('E2E_Filter_Expense', 'E2E_Filter_Income', 'E2E_Filter_Transfer');
    });

    await b.phase('analytics drilldown', async () => {
        await b.tapId(ctx, 'TabBar.Analytics');
        await b.expectId(ctx, 'AnalyticsPage.Container', 5_000);
        await dateFilter('DateChipActive', 'TODAY');
        await b.expectId(ctx, 'StatisticsSpendingHero.Spent.5');
        await b.expectId(ctx, 'CategoryStatisticsCard.Amount.E2E_Filter_Expense_Category.5000000');
        await b.tapId(ctx, 'CategoryStatisticsCard.E2E_Filter_Expense_Category');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Date_Today_Expense', 5_000);
        await back('AnalyticsPage.Container');
        await b.tapId(ctx, 'AnalyticsPage.Tab.Tags');
        await b.expectId(ctx, 'TagStatisticsCard.Amount.E2E_Filter_Expense_Tag.5000000');
        await b.tapId(ctx, 'TagStatisticsCard.E2E_Filter_Expense_Tag');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Date_Today_Expense', 5_000);
        await back('AnalyticsPage.Container');
        await b.tapId(ctx, 'AnalyticsPage.Tab.Categories');
        await dateFilter('DateChipActive', 'ALL_TIME');
        await expect(screen.getByTestId(/^StatisticsSpendingHero\.Spent\.40_/).first()).toBeVisible();
        await b.expectId(ctx, 'CategoryStatisticsCard.Amount.E2E_Filter_Expense_Category.40000000');
        await b.expectNoId(ctx, 'CategoryStatisticsCard.Amount.E2E_Missing_Rate_Category.15000000000');
        await b.tapId(ctx, 'CategoryStatisticsCard.E2E_Filter_Expense_Category');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Historical_UAH_2026', 5_000);
        await b.scrollTo(ctx, 'TransactionCard.Label.E2E_Historical_UAH_2011');
        await back('AnalyticsPage.Container');
    });

    await b.phase('account detail counter', async () => {
        await b.tapId(ctx, 'TabBar.Home');
        await a.openAccountDetails(ctx, 'E2E Filter Cash A');
        await counter('4 transactions', 5_000);
        await b.scrollTo(ctx, 'TransactionCard.Label.E2E_Filter_Expense');
        await typeFilter('EXPENSE');
        await b.scrollTo(ctx, 'TransactionCard.Label.E2E_Filter_Expense');
        await hidden('E2E_Filter_Transfer');
        await counter('2 transactions');
    });
});
