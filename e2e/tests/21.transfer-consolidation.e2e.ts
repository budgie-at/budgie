// Port of tests/app-tests/flows/21.transfer-consolidation.flow.yaml.
import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const card = (name: string) => `TransactionCard.Label.E2E_Consolidation_${name}`;

test('21 transfer consolidation', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const text = (pattern: RegExp) => b.byText(screen, pattern);

    await budgie.start({ fixture: '21.db' });
    await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);

    await b.phase('sanity: sources visible', async () => {
        await t.navigateToTransactions(ctx);
        for (const name of ['P1_Out', 'P1_In', 'P2_Out', 'P2_In', 'Untouched']) await b.expectId(ctx, card(name));
        await b.scrollTo(ctx, card('ATM_Out'));
        await b.expectId(ctx, card('ATM_Out'));
        await b.scrollTo(ctx, card('SameBank_Out_5524'));
        await b.expectId(ctx, card('SameBank_In_0356'));
        await b.scrollTo(ctx, card('Bridge_Out'));
        await b.expectId(ctx, card('Bridge_In'));
        await b.scrollTo(ctx, card('Bridge_Chain_Out'));
        // The chain rows sit just past where Maestro's longer scroll stride stops; scroll on to each before asserting it.
        await b.scrollTo(ctx, card('Chain_Source'));
        await b.expectId(ctx, card('Chain_Source'));
        await b.scrollTo(ctx, card('Chain_Target'));
        await b.expectId(ctx, card('Chain_Target'));
    });

    await b.phase('consolidate matches', () => t.consolidateMatches(ctx));

    await b.phase('verify canonicals', async () => {
        await t.navigateToTransactions(ctx);
        const p1 = id(card('P1_Out'));
        if (!(await p1.isVisible())) {
            try {
                await screen.scrollUntilVisible(p1, { direction: 'up', timeout: 5_000 });
            } catch {
                await b.scrollTo(ctx, card('P1_Out'));
            }
        }
        await expect(text(/From E2E Consolidation A to E2E Consolidation B/)).toBeVisible({ timeout: 60_000 });
        await b.expectId(ctx, card('P2_Out'));
        await expect(text(/From E2E Consolidation USD to E2E Consolidation EUR/)).toBeVisible();
        await b.expectId(ctx, card('ATM_Out'));
        await expect(text(/to E2E Consolidation Cash/)).toBeHidden();
        await b.scrollTo(ctx, card('SameBank_Out_5524'));
        await expect(text(/From E2E Consolidation Privat Source to E2E Consolidation Privat Target/)).toBeVisible();
        await b.scrollTo(ctx, card('Bridge_Out'));
        await expect(text(/From E2E Consolidation Bridge Source to E2E Consolidation Bridge Target/)).toBeVisible();
        await b.scrollTo(ctx, card('Bridge_Chain_Out'));
        await expect(text(/From E2E Consolidation Chain Source to E2E Consolidation Chain Target/)).toBeVisible();
    });

    await b.phase('sources hidden, untouched survives', async () => {
        await b.expectNoId(ctx, card('Chain_Target'));
        await b.expectNoId(ctx, card('Chain_Source'));
        await b.scrollTo(ctx, card('SameBank_Out_5524'), 'up');
        await b.expectNoId(ctx, card('SameBank_In_0356'));
        await b.scrollTo(ctx, card('Bridge_Out'));
        await b.expectNoId(ctx, card('Bridge_In'));
        await b.scrollTo(ctx, card('P1_Out'), 'up');
        await b.expectNoId(ctx, card('P1_In'));
        await b.expectNoId(ctx, card('P2_In'));
        await b.expectId(ctx, card('Untouched'));
    });

    await b.phase('revert canonical 1', async () => {
        await b.scrollTo(ctx, card('P1_Out'), 'up');
        await b.tapId(ctx, card('P1_Out'));
        await b.expectId(ctx, 'TransactionInfo.Row.Consolidation', 10_000);
        await b.tapId(ctx, 'TransactionInfo.Row.Consolidation');
        await b.expectId(ctx, 'ConsolidationSourceModal.Row.0', 10_000);
        await b.expectId(ctx, 'ConsolidationSourceModal.Row.1');
        await expect(id('ConsolidationSourceModal.Row.0')).toHaveText(/^E2E Consolidation P1 Out, .*, ₴200$/i);
        await expect(id('ConsolidationSourceModal.Row.1')).toHaveText(/^E2E Consolidation P1 In, .*, \+₴200$/i);
        await b.expectId(ctx, 'ConsolidationSourceModal.RevertButton');
        await b.tapId(ctx, 'ConsolidationSourceModal.RevertButton');
        await t.confirmRevertConsolidation(ctx);
        await t.navigateToTransactions(ctx);
        await b.expectId(ctx, card('P1_In'), 10_000);
        await expect(text(/From E2E Consolidation A to /)).toBeHidden({ timeout: 5_000 });
    });

    await b.phase('final balances', async () => {
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await b.scrollTo(ctx, 'AccountCard.AddBalance.E2E_Consolidation_Cash');
        await b.expectId(ctx, 'AccountCard.AddBalance.E2E_Consolidation_Cash');
        await b.scrollTo(ctx, 'AccountCard.Balance.E2E_Consolidation_A.750');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Consolidation_A.750');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Consolidation_B.200');
        await b.scrollTo(ctx, 'AccountCard.Balance.E2E_Consolidation_Untouched.0');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Consolidation_Untouched.0');
    });
});
