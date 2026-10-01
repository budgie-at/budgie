import * as Effect from 'effect/Effect';

import { findMccByCode } from '../db/find-mcc-by-code';

import { seedAccountPair } from './seed-account-pair';
import { seedBankPair } from './seed-bank-pair';

export const seedAmountTransferPair = (amount: number, operatedAt: Date = new Date(2026, 0, 15, 12, 0, 0)) =>
    Effect.gen(function* () {
        const { fromAccount, toAccount } = yield* seedAccountPair();
        const transferMcc = yield* findMccByCode('4829');

        const expense = yield* seedBankPair.expense(
            { externalId: 'tx-expense', operatedAt },
            { accountId: fromAccount.id, amount, mccCategoryId: transferMcc.id }
        );
        const income = yield* seedBankPair.income(
            { externalId: 'tx-income', operatedAt: new Date(operatedAt.getTime() + 5_000) },
            { accountId: toAccount.id, amount, mccCategoryId: transferMcc.id }
        );

        return { fromAccount, toAccount, expense, income, transferMcc };
    });
