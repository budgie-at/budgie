import assert from 'node:assert/strict';

import { mustExec } from '@mobile-ci/e2e-simlock/exec';
import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

const ETH_ACCOUNT_ID = 501;
const TERM_DEPOSIT_ID = 503;

const previousMonthStart = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;
};

test('52 passive income', { tags: ['passive-income'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const plotValue = () => id('PassiveIncome.Plot').inputValue();
    const firstPayout = () => screen.getByTestId(/^PassiveIncome\.Payout\./u).first();
    const expandHeader = async () => {
        await b.scrollTo(ctx, 'PassiveIncome.Footnote', 'up');
        const page = await id('PassiveIncome.Page').boundingBox();
        assert.ok(page);
        const x = page.x + 10;
        await screen.swipe({ from: { x, y: page.y + page.height * 0.3 }, to: { x, y: page.y + page.height * 0.95 }, duration: 300 });
        await b.expectSettledId(ctx, 'PassiveIncome.Subtitle');
    };

    await budgie.start({ fixture: '52.db' });

    await b.phase('1a analytics card opens the screen on its bucket', async () => {
        await b.openLink(ctx, 'budgie://analytics');
        await b.expectId(ctx, 'PassiveIncome.AnalyticsCard', 15_000);
        const cardText = (await id('PassiveIncome.AnalyticsCard').textContent()) ?? '';
        await b.tapId(ctx, 'PassiveIncome.AnalyticsCard');
        await b.expectId(ctx, 'PassiveIncome.Hero', 15_000);
        const heroFigure = cardText.match(/[^\s\d]?\d[\d,.]*/u)?.[0] ?? '';
        assert.ok(heroFigure.length > 0);
        await expect(id('PassiveIncome.Caption')).toContainText('so far');
        if (b.isIos(ctx)) {
            assert.ok((await plotValue()).includes(heroFigure));
            assert.match(await plotValue(), /so far/u);
        }
        await expect(id('PassiveIncome.Hero')).toHaveAccessibleName(/^Earned .*% a year across \d+ holdings?/u);
        await expect(id('PassiveIncome.Hero')).toHaveAccessibleName(/new this period/u);
        await b.scrollTo(ctx, 'PassiveIncome.NetAfterTax');
        await b.tapId(ctx, 'PassiveIncome.Mode.RUNNING_TOTAL');
        await expect(id('PassiveIncome.ChartTitle')).toHaveText('Running total');
        await b.tapId(ctx, 'PassiveIncome.Mode.BARS');
    });

    await b.phase('1b focus, tap, legend isolate and scrub', async () => {
        await b.openLink(ctx, `budgie://passive-income?range=YEAR&focus=${previousMonthStart()}`);
        await b.expectId(ctx, 'PassiveIncome.Plot', 15_000);
        await expect(id('PassiveIncome.Caption')).not.toContainText('so far');
        if (b.isIos(ctx)) {
            assert.doesNotMatch(await plotValue(), /so far/u);
        }
        await b.tapId(ctx, 'PassiveIncome.Plot');
        await expect(id('PassiveIncome.Caption')).toContainText('Earned');
        if (b.isIos(ctx)) {
            assert.match(await plotValue(), /so far/u);
        }
        await b.tapId(ctx, 'PassiveIncome.LegendRow.STAKING_EARN');
        await expect(id('PassiveIncome.Caption')).toContainText('Staking & Earn');
        if (b.isIos(ctx)) {
            await id('PassiveIncome.Plot').swipe({ direction: 'left', momentum: 'slow' });
            await expect(id('PassiveIncome.Caption')).toContainText('Staking & Earn');
        }
        await b.tapId(ctx, 'PassiveIncome.LegendRow.STAKING_EARN');
        await expect(id('PassiveIncome.Caption')).toContainText('Earned');
    });

    await b.phase('2 position row filters to its payouts and back', async () => {
        await b.scrollTo(ctx, `PassiveIncome.Position.${ETH_ACCOUNT_ID}`);
        await b.tapId(ctx, `PassiveIncome.Position.${ETH_ACCOUNT_ID}`);
        await expandHeader();
        await expect(id('PassiveIncome.Subtitle')).toHaveText('E2E Binance ETH');
        await b.scrollTo(ctx, 'PassiveIncome.Section.PAYOUTS');
        await firstPayout().tap();
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await expandHeader();
        await b.tapId(ctx, 'PassiveIncome.ClearFilter');
        await expect(id('PassiveIncome.Subtitle')).toHaveText('All holdings');
    });

    await b.phase('3 transaction details yield row opens the filtered screen', async () => {
        await b.scrollTo(ctx, `PassiveIncome.Position.${ETH_ACCOUNT_ID}`);
        await b.tapId(ctx, `PassiveIncome.Position.${ETH_ACCOUNT_ID}`);
        await b.scrollTo(ctx, 'PassiveIncome.Section.PAYOUTS');
        await firstPayout().tap();
        await b.expectId(ctx, 'TransactionInfo.Row.Yield', 10_000);
        await b.tapId(ctx, 'TransactionInfo.Row.Yield');
        await expect(id('PassiveIncome.Subtitle')).toHaveText('E2E Binance ETH');
    });

    await b.phase('4 closing a deposit records its interest', async () => {
        if (!b.isIos(ctx)) {
            return;
        }

        await b.openLink(ctx, `budgie://account/${TERM_DEPOSIT_ID}/details`);
        await b.expectId(ctx, 'AccountDetails.Page', 10_000);
        await b.tapId(ctx, 'AccountDetails.ActionsButton');
        await b.expectId(ctx, 'AccountDetails.CloseDepositButton', 3_000);
        await b.tapId(ctx, 'AccountDetails.CloseDepositButton');
        await b.expectId(ctx, 'AccountPickerBottomSheet.Input', 10_000);
        await a.selectAccountFromNativePicker(ctx, 'AccountPickerBottomSheet.Option.E2E Cash');
        await b.expectId(ctx, 'DepositClose.AmountInput', 10_000);
        await b.fillId(ctx, 'DepositClose.AmountInput', '1010');
        await expect(id('DepositClose.DeltaLine')).toContainText('Interest recorded: +');
        await b.tapId(ctx, 'DepositClose.ConfirmButton');
        await b.expectId(ctx, 'TabBar.Home', 15_000);
        await b.openLink(ctx, 'budgie://passive-income?range=YEAR');
        await b.scrollTo(ctx, `PassiveIncome.Position.${TERM_DEPOSIT_ID}`);
        await expect(id(`PassiveIncome.Position.${TERM_DEPOSIT_ID}`)).toContainText('10.00');
    });

    await b.phase('6 large text: one-column legend and a range menu', async () => {
        if (!b.isIos(ctx)) {
            return;
        }

        const lease = await budgie.lease();

        try {
            await mustExec(budgie.api, lease, ['ui', 'content_size', 'extra-extra-extra-large']);
            await b.openLink(ctx, 'budgie://passive-income');
            await b.expectId(ctx, 'PassiveIncome.Legend.Columns1', 15_000);
            await b.expectId(ctx, 'PassiveIncome.RangeMenu');
        } finally {
            await mustExec(budgie.api, lease, ['ui', 'content_size', 'large']);
        }
    });
});

test('52 passive income absent without yield', { tags: ['passive-income'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '52-empty.db' });

    await b.phase('7 the Categories tab has no passive income card', async () => {
        await b.openLink(ctx, 'budgie://analytics');
        await b.expectId(ctx, 'AnalyticsPage.Container', 15_000);
        await b.expectId(ctx, 'AnalyticsPage.Tab.Categories');
        await b.expectNoId(ctx, 'PassiveIncome.AnalyticsCard');
    });
});
