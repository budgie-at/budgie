import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { AccountTypeEnum, ExternalSourceEnum, PRECISION } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    P2P_OPERATED_AT,
    expectP2pUnconsolidated,
    fetchP2pCanonical,
    fetchTransactionById,
    seed,
    seedBankPair,
    seedP2pFiatTransferFixture,
    seedP2pIncome
} from '../../harness';

const SPLIT_FIRST_AMOUNT = Number('1534') * PRECISION;
const SPLIT_SECOND_AMOUNT = Number('6640') * PRECISION;
const SPLIT_TOTAL_AMOUNT = SPLIT_FIRST_AMOUNT + SPLIT_SECOND_AMOUNT;
const SPLIT_USDT_AMOUNT = Number('187.21') * PRECISION;
const THREE_EXPENSE_AMOUNTS = ['1000', '1400', '1600'].map(Number);
const GROUP_EXPENSE_AMOUNT = 1_000 * PRECISION;
const FIRST_MIXED_ACCOUNT_AMOUNT = Number('1500') * PRECISION;
const SECOND_MIXED_ACCOUNT_AMOUNT = Number('2500') * PRECISION;
const FIRST_SPLIT_OFFSET_MS = 113_000;
const SECOND_SPLIT_OFFSET_MS = 158_000;

describe('consolidation/binance-p2p-fiat-transfer grouped expenses', () => {
    it('auto-consolidates two bank expenses that jointly fund one Binance P2P buy', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const firstExpense = seedBankPair.expense(
            { externalId: 'mono-uah-split-1', operatedAt: new Date(P2P_OPERATED_AT.getTime() + FIRST_SPLIT_OFFSET_MS) },
            { accountId: bankAccount.id, amount: SPLIT_FIRST_AMOUNT }
        );
        const secondExpense = seedBankPair.expense(
            { externalId: 'mono-uah-split-2', operatedAt: new Date(P2P_OPERATED_AT.getTime() + SECOND_SPLIT_OFFSET_MS) },
            { accountId: bankAccount.id, amount: SPLIT_SECOND_AMOUNT }
        );
        const income = seedBankPair.income(
            { externalId: 'binance:c2c:buy-split', operatedAt: P2P_OPERATED_AT },
            { accountId: binanceAccount.id, amount: SPLIT_USDT_AMOUNT }
        );

        expect(await transferConsolidationService.consolidate()).toEqual({ found: 1, consolidated: 1 });

        const canonical = fetchP2pCanonical();
        expect(canonical.fromAccountId).toBe(bankAccount.id);
        expect(canonical.toAccountId).toBe(binanceAccount.id);
        expect(canonical.exchangeRate).toBeCloseTo(SPLIT_TOTAL_AMOUNT / SPLIT_USDT_AMOUNT);
        expect([firstExpense, secondExpense, income].map(item => fetchTransactionById(item.id).consolidationParentTransactionId)).toEqual([
            canonical.id,
            canonical.id,
            canonical.id
        ]);
    });

    it('auto-consolidates three same-account expenses into one P2P buy', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const expenses = THREE_EXPENSE_AMOUNTS.map((amount, index) =>
            seedBankPair.expense(
                {
                    externalId: `mono-uah-three-${index}`,
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + (index + 1) * 30_000)
                },
                { accountId: bankAccount.id, amount: amount * PRECISION }
            )
        );
        const income = seedP2pIncome('binance:c2c:buy-three', binanceAccount.id);

        expect(await transferConsolidationService.consolidate()).toEqual({ found: 1, consolidated: 1 });

        const canonicalId = fetchP2pCanonical().id;
        expect([...expenses, income].map(item => fetchTransactionById(item.id).consolidationParentTransactionId)).toEqual([
            canonicalId,
            canonicalId,
            canonicalId,
            canonicalId
        ]);
    });
});

describe('consolidation/binance-p2p-fiat-transfer group limits', () => {
    it('does not combine four expenses into one P2P buy', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const expenses = [0, 1, 2, 3].map(index =>
            seedBankPair.expense(
                {
                    externalId: `mono-uah-four-${index}`,
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + (index + 1) * 30_000)
                },
                { accountId: bankAccount.id, amount: GROUP_EXPENSE_AMOUNT }
            )
        );
        const income = seedP2pIncome('binance:c2c:buy-four', binanceAccount.id);

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(0);
        expectP2pUnconsolidated([...expenses, income]);
    });

    it('does not combine expenses from different bank accounts', async () => {
        const { uah, bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const secondBankAccount = seed.account({
            title: 'Second Monobank UAH',
            type: AccountTypeEnum.BANK_SYNC,
            externalSource: ExternalSourceEnum.MONOBANK,
            instrumentId: uah.id
        });
        const firstExpense = seedBankPair.expense(
            { externalId: 'mono-uah-mixed-1', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: FIRST_MIXED_ACCOUNT_AMOUNT }
        );
        const secondExpense = seedBankPair.expense(
            { externalId: 'mono-uah-mixed-2', operatedAt: P2P_OPERATED_AT },
            { accountId: secondBankAccount.id, amount: SECOND_MIXED_ACCOUNT_AMOUNT }
        );
        const income = seedP2pIncome('binance:c2c:buy-mixed', binanceAccount.id);

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(0);
        expectP2pUnconsolidated([firstExpense, secondExpense, income]);
    });
});
