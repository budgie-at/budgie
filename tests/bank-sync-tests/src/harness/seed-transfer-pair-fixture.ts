import { AccountTypeEnum, PRECISION } from '@budgie/contracts';

import { seed } from './seed';
import { seedBankExpense, seedBankIncome } from './seed-bank-pair';

interface AccountPairInput {
    readonly fromIban?: string | null;
    readonly toIban?: string | null;
}

export const seedAccountPair = (input: AccountPairInput = {}) => ({
    fromAccount: seed.account({ externalId: 'mono-from', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: input.fromIban ?? null }),
    toAccount: seed.account({ externalId: 'mono-to', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: input.toIban ?? null })
});

interface TransferPairFixtureInput {
    readonly amount?: number;
    readonly operatedAt?: Date;
}

export const seedTransferPairFixture = (input: TransferPairFixtureInput = {}) => {
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
