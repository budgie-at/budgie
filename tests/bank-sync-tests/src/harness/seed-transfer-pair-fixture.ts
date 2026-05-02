import { seed } from './seed';
import { seedBankExpense, seedBankIncome } from './seed-bank-pair';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

interface AccountPairInput {
    readonly fromIban?: string | null;
    readonly toIban?: string | null;
}

interface AccountPair {
    readonly fromAccount: AccountEntityInterface;
    readonly toAccount: AccountEntityInterface;
}

export const seedAccountPair = (input: AccountPairInput = {}): AccountPair => ({
    fromAccount: seed.account({ externalId: 'mono-from', type: 'BANK_SYNC', instrumentId: 1, iban: input.fromIban ?? null }),
    toAccount: seed.account({ externalId: 'mono-to', type: 'BANK_SYNC', instrumentId: 1, iban: input.toIban ?? null })
});

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
    const { fromAccount, toAccount } = seedAccountPair({ fromIban: 'UA-FROM', toIban: 'UA-TO' });

    const operatedAt = input.operatedAt ?? new Date(2026, 0, 15, 12, 0, 0);
    const amount = (input.amount ?? 100) * PRECISION;

    const expense = seedBankExpense({
        accountId: fromAccount.id,
        amount,
        operatedAt,
        externalId: 'tx-expense',
        toIban: 'UA-TO'
    });
    const income = seedBankIncome({
        accountId: toAccount.id,
        amount,
        operatedAt,
        externalId: 'tx-income'
    });

    return { fromAccount, toAccount, expense, income };
};
