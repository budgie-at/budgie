import * as b from '../support/budgie/core.ts';
import * as r from '../support/budgie/rules.ts';
import { test } from '../support/budgie/test.ts';

test('26 rules suggestions', { tags: ['rules'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    // setup/setup-rules-test
    await budgie.start({ fixture: '25.db' });
    const csv = await budgie.csvFixturesUri();

    await b.phase('suggested rule: 2 conditions', () =>
        r.createSuggestedRuleFromTransaction(ctx, csv, {
            category: 'Groceries',
            csv: 'test15-suggested-rule',
            conditions: 2,
            cardId: 'TransactionCard.Label.Test15_Unique_Purchase'
        })
    );
    await b.phase('suggested rule: 3 conditions', () =>
        r.createSuggestedRuleFromTransaction(ctx, csv, {
            category: 'Shopping',
            csv: 'test17-suggested-rule',
            conditions: 3,
            cardId: 'TransactionCard.Label.Store_C_Kyiv'
        })
    );
    await b.phase('suggested rule: duplicate check', () =>
        r.createSuggestedRuleFromTransaction(ctx, csv, {
            category: 'Groceries',
            csv: 'test25-duplicate-rule',
            conditions: 2,
            cardId: 'TransactionCard.Label.Test25_Duplicate_Check'
        })
    );
});
