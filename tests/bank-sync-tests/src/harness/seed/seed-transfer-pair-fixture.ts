import { PRECISION } from '@budgie/contracts';

import { seedAccountPair } from './seed-account-pair';
import { seedBankPair } from './seed-bank-pair';

export const seedTransferPairFixture = (amount: number = 100, operatedAt: Date = new Date(2026, 0, 15, 12, 0, 0)) => {
    const { fromAccount, toAccount } = seedAccountPair('UA-FROM', 'UA-TO');
    const microAmount = amount * PRECISION;

    const expense = seedBankPair.expense(
        { externalId: 'tx-expense', operatedAt },
        { accountId: fromAccount.id, amount: microAmount, toIban: 'UA-TO' }
    );
    const income = seedBankPair.income(
        { externalId: 'tx-income', operatedAt },
        { accountId: toAccount.id, amount: microAmount }
    );

    return { fromAccount, toAccount, expense, income };
};
