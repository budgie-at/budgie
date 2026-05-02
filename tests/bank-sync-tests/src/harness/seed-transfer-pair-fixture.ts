import { seed } from './seed';
import { seedBankExpense, seedBankIncome } from './seed-bank-pair';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

const PRECISION = 1_000_000;

interface TransferPairFixtureInput {
    readonly amount?: number;
    readonly operatedAt?: Date;
}

interface TransferPairFixture {
    readonly fromAccount: AccountEntityInterface;
    readonly toAccount: AccountEntityInterface;
    readonly expense: TransactionEntityInterface;
    readonly income: TransactionEntityInterface;
}

export const seedTransferPairFixture = (input: TransferPairFixtureInput = {}): TransferPairFixture => {
    const fromAccount = seed.account({ externalId: 'mono-from', type: 'BANK_SYNC', instrumentId: 1, iban: 'UA-FROM' });
    const toAccount = seed.account({ externalId: 'mono-to', type: 'BANK_SYNC', instrumentId: 1, iban: 'UA-TO' });

    const operatedAt = input.operatedAt ?? new Date(2026, 0, 15, 12, 0, 0);
    const amountMicro = (input.amount ?? 100) * PRECISION;

    const expense = seedBankExpense({
        accountId: fromAccount.id,
        amountMicro,
        operatedAt,
        externalId: 'tx-expense',
        counterIban: 'UA-TO'
    });
    const income = seedBankIncome({
        accountId: toAccount.id,
        amountMicro,
        operatedAt,
        externalId: 'tx-income'
    });

    return { fromAccount, toAccount, expense, income };
};
