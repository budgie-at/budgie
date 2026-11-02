// Port of tests/app-tests/flows/26.rules-convert-to-transfer.flow.yaml.
import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import * as r from '../support/budgie/rules.ts';
import { test } from '../support/budgie/test.ts';
import { createExpense } from '../support/budgie/transactions.ts';

const ACCOUNT = 'Rules Test Account';
const CATEGORY = 'Rules Test Category';
const DESTINATION = 'Test22 Destination';

test('26 rules convert to transfer', { tags: ['rules'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;

    // setup/setup-rules-test
    await budgie.start({ fixture: '25.db' });

    await b.phase('create expense', () =>
        createExpense(ctx, { amount: '10', account: ACCOUNT, category: CATEGORY, comment: 'Auto Transfer' })
    );

    await b.phase('create convert-to-transfer rule', async () => {
        await r.navigateToRules(ctx);
        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'COMMENT');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Auto Transfer');
        await b.done(ctx);
        await r.pick(ctx, 'RuleForm.Action.0.TypeSelector', 'CONVERT_TO_TRANSFER');
        await b.scrollTo(ctx, 'RuleForm.Action.0.AccountSelector');
        await b.tapId(ctx, 'RuleForm.Action.0.AccountSelector');
        await r.selectAccountInPicker(ctx, DESTINATION);
        await r.submitRuleApplyExisting(ctx);
        await b.expectId(ctx, 'RulesPage.Page');
        await r.expectRuleCard(ctx);
        await expect(b.byId(screen, 'RulesPage.RuleCard.0')).toContainText(DESTINATION);
    });

    await b.phase('transaction converted to transfer', async () => {
        await b.openLink(ctx, 'budgie://transactions/9/transfer');
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await b.expectNoId(ctx, 'TransactionInfo.Row.Note');
        await b.expectId(ctx, 'TransactionInfo.Row.FromAccount');
        await b.expectId(ctx, 'TransactionInfo.Row.ToAccount');
        await b.tapUntil(ctx, 'TransactionInfo.EditButton.Label', () =>
            expect(b.byText(screen, 'Edit Transfer')).toBeVisible({ timeout: 10_000 })
        );
        await expect(b.byText(screen, 'Note: Auto Transfer')).toBeVisible();
        await b.expectId(ctx, `TransferForm.SelectedFromAccount.${ACCOUNT}`);
        await b.expectId(ctx, `TransferForm.SelectedToAccount.${DESTINATION}`);
    });
});
