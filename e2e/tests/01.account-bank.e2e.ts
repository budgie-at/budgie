import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('01 account bank', { tags: ['accounts'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '01.db' });

    await b.phase('create bank account', () =>
        a.createLiabilityAccount(ctx, { typeId: 'CreateAccount.BANK', name: 'E2E Checking Account', currency: 'EUR', amount: '100' })
    );

    await b.phase('exercise account', () =>
        a.exerciseLiabilityAccount(ctx, {
            name: 'E2E Checking Account',
            currency: 'EUR',
            updatedName: 'E2E Checking Account EUR',
            initialAmount: '100',
            increaseTo: '175',
            increaseDelta: '75',
            decreaseTo: '140',
            decreaseDelta: '35'
        })
    );
});
