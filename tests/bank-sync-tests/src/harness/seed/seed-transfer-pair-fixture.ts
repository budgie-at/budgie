import { AccountTypeEnum, PRECISION } from '@budgie/contracts';

import { seed } from './seed';
import { seedBankExpense, seedBankIncome } from './seed-bank-pair';

export const seedAccountPair = (fromIban: string | null = null, toIban: string | null = null) => ({
    fromAccount: seed.account({ externalId: 'mono-from', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: fromIban }),
    toAccount: seed.account({ externalId: 'mono-to', type: AccountTypeEnum.BANK_SYNC, instrumentId: 1, iban: toIban })
});

export const seedTransferPairFixture = (amount: number = 100, operatedAt: Date = new Date(2026, 0, 15, 12, 0, 0)) => {
    const { fromAccount, toAccount } = seedAccountPair('UA-FROM', 'UA-TO');
    const microAmount = amount * PRECISION;

    const expense = seedBankExpense({
        accountId: fromAccount.id,
        amount: microAmount,
        operatedAt,
        externalId: 'tx-expense',
        toIban: 'UA-TO'
    });
    const income = seedBankIncome({
        accountId: toAccount.id,
        amount: microAmount,
        operatedAt,
        externalId: 'tx-income'
    });

    return { fromAccount, toAccount, expense, income };
};
