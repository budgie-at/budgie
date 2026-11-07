import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import * as s from '../support/budgie/settings.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const card = (name: string) => `TransactionCard.Label.E2E_Refund_${name}`;

test('22 refund consolidation', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const openInfo = async (path: string, waitId = 'TransactionInfo.Page') => {
        await b.openLink(ctx, `budgie://transactions/${path}`);
        await b.expectId(ctx, waitId, 10_000);
    };
    const sources = async (row: RegExp) => {
        await b.tapId(ctx, 'TransactionInfo.Row.Consolidation');
        await b.expectId(ctx, 'ConsolidationSourceModal.Row.0', 10_000);
        await expect(b.byText(screen, row)).toBeVisible();
    };
    const closeSources = async () => {
        await b.tapId(ctx, 'ConsolidationSourceModal.DoneButton');
        await b.expectNoId(ctx, 'ConsolidationSourceModal.Row.0', 5_000);
    };

    await budgie.start({ fixture: '22.db' });

    await b.phase('manual convert to refund and revert', async () => {
        await openInfo('3/income');
        await t.openInfoConversions(ctx);
        await b.tapText(ctx, 'Convert to Refund');
        await b.expectId(ctx, 'ConvertToRefund.Page', 10_000);
        await b.expectId(ctx, 'ConvertToRefund.CandidateRow.2');
        await expect(b.byText(screen, 'Refund')).toBeVisible();
        await b.tapId(ctx, 'ConvertToRefund.CandidateRow.2');
        await expect(id('ConvertToRefund.ConvertButton')).toBeEnabled();
        await id('ConvertToRefund.SearchInput').fill('E2E Refund Full');
        await b.expectId(ctx, 'ConvertToRefund.CandidateRow.4');
        await b.expectNoId(ctx, 'ConvertToRefund.CandidateRow.2');
        await id('ConvertToRefund.SearchInput').press('Enter');
        await expect(id('ConvertToRefund.ConvertButton')).toBeDisabled();
        await id('ConvertToRefund.SearchInput').fill('no matching purchase');
        await b.expectText(ctx, 'No matching expenses');
        await id('ConvertToRefund.SearchInput').clear();
        await id('ConvertToRefund.SearchInput').press('Enter');
        await b.expectId(ctx, 'ConvertToRefund.CandidateRow.2');
        await b.tapId(ctx, 'ConvertToRefund.CandidateRow.2');
        await b.tapId(ctx, 'ConvertToRefund.ConvertButton');
        await expect(b.byText(screen, 'Convert to Refund?')).toBeVisible();
        await screen.getByRole('button', { name: 'Convert' }).last().tap();
        await b.expectId(ctx, 'TransactionInfo.Row.Consolidation', 10_000);
        await sources(/^E2E Refund Partial, \+₴40, .*/i);
        await b.tapId(ctx, 'ConsolidationSourceModal.RevertButton');
        await t.confirmRevertConsolidation(ctx);
        await openInfo('3/income');
        await b.expectNoId(ctx, 'TransactionInfo.Row.RefundSummary', 10_000);
        await t.openInfoConversions(ctx);
        await b.expectText(ctx, 'Convert to Refund');
        await t.closeMenu(ctx);
        await b.scrollTo(ctx, 'TransactionInfo.Amount', 'up');
    });

    await b.phase('candidates in the list', async () => {
        await b.openLink(ctx, 'budgie://transactions');
        await b.expectId(ctx, 'TransactionsPage.Container', 10_000);
        for (const name of ['Localized', 'Partial', 'Full', 'Ambiguous']) {
            await b.scrollTo(ctx, card(name));
            await b.expectId(ctx, card(name));
        }
        await id(card('Ambiguous')).longPress();
        await b.expectId(ctx, 'TransactionContextMenu.ConvertToRefundButton', 3_000);
        await t.closeMenu(ctx);
    });

    await b.phase('money upgrade and consolidate', async () => {
        await s.runMoneyDataUpgrade(ctx);
        await t.consolidateMatches(ctx);
    });

    await b.phase('refunds consolidated', async () => {
        await t.navigateToTransactions(ctx);
        await b.scrollTo(ctx, card('Localized'), 'up');
        await expect(b.byText(screen, /^E2E Refund Localized, ₴18, Refunded/i)).toBeVisible();
        await b.expectNoId(ctx, 'TransactionCard.Amount.10');
        await b.expectId(ctx, card('Localized'));
        const full = screen
            .getByTestId(card('Full'))
            .filter({ hasText: /^E2E Refund Full, ₴55, Refunded/i })
            .first();
        await screen.scrollUntilVisible(full, { direction: 'down', timeout: 20_000 });
        await expect(full).toBeVisible();
        await b.expectNoId(ctx, 'TransactionCard.Amount.3');
        await b.expectNoId(ctx, 'TransactionCard.Amount.5');
        await b.scrollTo(ctx, card('Ambiguous'));
        await b.expectId(ctx, 'TransactionCard.Amount.8');
        await b.expectId(ctx, card('Ambiguous'));
    });

    await b.phase('consolidation sources', async () => {
        await openInfo('4/expense', 'TransactionInfo.Row.Consolidation');
        await sources(/^E2E Refund Full, \+₴55, .*/i);
        await closeSources();
        await openInfo('9/expense', 'TransactionInfo.Row.Consolidation');
        await sources(/^Скасування\. E2E Refund Localized, \+₴18, .*/i);
        await closeSources();
    });

    await b.phase('analytics', async () => {
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.tapId(ctx, 'TabBar.Analytics');
        await b.expectId(ctx, 'AnalyticsPage.Container', 10_000);
        await b.scrollTo(ctx, 'CategoryStatisticsCard.Amount.Restaurants_Cafes.80000000');
        await b.expectId(ctx, 'CategoryStatisticsCard.Amount.Restaurants_Cafes.80000000');
    });
});
