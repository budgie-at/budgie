import { describe, it } from 'vitest';

import { AccountTypeEnum, ExternalSourceEnum, PRECISION, UserIconNameEnum } from '@budgie/contracts';

import { expectTransferPairConsolidation, findMccByCode, seed, seedBankPair } from '../../harness';

const TRANSFER_AMOUNT = 250 * PRECISION;
const INCOME_OFFSET_MS = 5_000;

describe('consolidation/monobank-card-to-jar-transfer', () => {
    it('auto-consolidates a card top-up expense with the jar incoming transfer', async () => {
        const card = seed.account({
            title: 'Monobank Black •1234',
            type: AccountTypeEnum.BANK_SYNC,
            externalId: 'mono-card',
            externalSource: ExternalSourceEnum.MONOBANK,
            instrumentId: 1,
            icon: UserIconNameEnum.Landmark
        });
        const jar = seed.account({
            title: 'Monobank «Студія»',
            type: AccountTypeEnum.BANK_SYNC,
            externalId: 'mono-jar',
            externalSource: ExternalSourceEnum.MONOBANK,
            instrumentId: 1,
            icon: UserIconNameEnum.PiggyBank
        });
        const transferMcc = findMccByCode('4829');
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);

        const expense = seedBankPair.expense(
            { externalId: 'mono-jar-topup-out', operatedAt },
            { accountId: card.id, amount: TRANSFER_AMOUNT, mccCategoryId: transferMcc.id }
        );
        const income = seedBankPair.income(
            { externalId: 'mono-jar-topup-in', operatedAt: new Date(operatedAt.getTime() + INCOME_OFFSET_MS) },
            { accountId: jar.id, amount: TRANSFER_AMOUNT, mccCategoryId: transferMcc.id }
        );

        await expectTransferPairConsolidation(expense.id, income.id);
    });
});
