import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    P2P_ONE_HOUR_MS,
    P2P_OPERATED_AT,
    P2P_OUT_OF_WINDOW_OFFSET_MS,
    P2P_UAH_TOTAL,
    P2P_USDT_AMOUNT,
    expectConsolidatedToP2pCanonical,
    expectP2pUnconsolidated,
    fetchCanonicalsOfType,
    fetchP2pCanonical,
    fetchTransactionById,
    seedBankPair,
    seedP2pFiatTransferFixture,
    seedP2pIncome,
    seedP2pPair
} from '../../harness';

const ONE_SECOND_MS = 1_000;
const TIED_COMBINATION_AMOUNTS = ['1000', '1500', '2500', '3000'].map(Number);
const CLOSER_INCOME_OFFSET_MS = 60_000;
const FARTHER_INCOME_OFFSET_MS = 120_000;
const FIRST_FIXED_POINT_EXPENSE_OFFSET_MS = 10_000;
const SECOND_FIXED_POINT_INCOME_OFFSET_MS = 11_000;
const SECOND_FIXED_POINT_EXPENSE_OFFSET_MS = 20_000;

describe('consolidation/binance-p2p-fiat-transfer time window', () => {
    it('accepts an expense exactly one hour away', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const { expense, income } = seedP2pPair(
            { externalId: 'mono-uah-one-hour', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
            { externalId: 'binance:c2c:buy-one-hour', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT },
            P2P_ONE_HOUR_MS
        );

        expect(await transferConsolidationService.consolidate()).toEqual({ found: 1, consolidated: 1 });
        expectConsolidatedToP2pCanonical(expense, income, bankAccount.id, binanceAccount.id);
    });

    it('rejects an expense one second beyond the one-hour window', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const { expense, income } = seedP2pPair(
            { externalId: 'mono-uah-one-hour-one-second', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
            { externalId: 'binance:c2c:buy-one-hour-one-second', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT },
            P2P_ONE_HOUR_MS + ONE_SECOND_MS
        );

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(0);
        expectP2pUnconsolidated([expense, income]);
    });

    it('does not consolidate a correctly-priced pair outside the time window', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        seedP2pPair(
            { externalId: 'mono-uah-late', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
            { externalId: 'binance:c2c:buy-late', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT },
            P2P_OUT_OF_WINDOW_OFFSET_MS
        );

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(0);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });
});

describe('consolidation/binance-p2p-fiat-transfer ambiguity', () => {
    it('rejects equal-best expense combinations for one Binance income', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const expenses = TIED_COMBINATION_AMOUNTS.map((amount, index) =>
            seedBankPair.expense(
                { externalId: `mono-uah-combination-tie-${index}`, operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: amount * PRECISION }
            )
        );
        const income = seedP2pIncome('binance:c2c:buy-combination-tie', binanceAccount.id);

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(0);
        expectP2pUnconsolidated([...expenses, income]);
    });

    it('rejects equal ownership of one bank expense by two Binance incomes', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const expense = seedBankPair.expense(
            { externalId: 'mono-uah-overlap-tie', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
        );
        const incomes = ['first', 'second'].map(label =>
            seedBankPair.income(
                {
                    externalId: `binance:c2c:buy-overlap-tie-${label}`,
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + FARTHER_INCOME_OFFSET_MS)
                },
                { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
            )
        );

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(0);
        expectP2pUnconsolidated([expense, ...incomes]);
    });
});

describe('consolidation/binance-p2p-fiat-transfer ranked ownership', () => {
    it('assigns an overlapping bank expense to its uniquely better Binance income', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const expense = seedBankPair.expense(
            { externalId: 'mono-uah-overlap-ranked', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
        );
        const closerIncome = seedBankPair.income(
            {
                externalId: 'binance:c2c:buy-overlap-closer',
                operatedAt: new Date(P2P_OPERATED_AT.getTime() + CLOSER_INCOME_OFFSET_MS)
            },
            { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
        );
        const fartherIncome = seedBankPair.income(
            {
                externalId: 'binance:c2c:buy-overlap-farther',
                operatedAt: new Date(P2P_OPERATED_AT.getTime() + FARTHER_INCOME_OFFSET_MS)
            },
            { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
        );

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(1);

        const canonicalId = fetchP2pCanonical().id;
        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicalId);
        expect(fetchTransactionById(closerIncome.id).consolidationParentTransactionId).toBe(canonicalId);
        expect(fetchTransactionById(fartherIncome.id).consolidationParentTransactionId).toBeNull();
    });

    it('resolves a newly exposed P2P pair in the same consolidation run', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const firstIncome = seedP2pIncome('binance:c2c:buy-fixed-point-a', binanceAccount.id);
        const secondIncome = seedBankPair.income(
            {
                externalId: 'binance:c2c:buy-fixed-point-b',
                operatedAt: new Date(P2P_OPERATED_AT.getTime() + SECOND_FIXED_POINT_INCOME_OFFSET_MS)
            },
            { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
        );
        const firstExpense = seedBankPair.expense(
            {
                externalId: 'mono-uah-fixed-point-x',
                operatedAt: new Date(P2P_OPERATED_AT.getTime() + FIRST_FIXED_POINT_EXPENSE_OFFSET_MS)
            },
            { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
        );
        const secondExpense = seedBankPair.expense(
            {
                externalId: 'mono-uah-fixed-point-y',
                operatedAt: new Date(P2P_OPERATED_AT.getTime() + SECOND_FIXED_POINT_EXPENSE_OFFSET_MS)
            },
            { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
        );

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(2);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(2);
        expect(fetchTransactionById(firstIncome.id).consolidationParentTransactionId).toBe(
            fetchTransactionById(secondExpense.id).consolidationParentTransactionId
        );
        expect(fetchTransactionById(secondIncome.id).consolidationParentTransactionId).toBe(
            fetchTransactionById(firstExpense.id).consolidationParentTransactionId
        );
        expect(fetchTransactionById(firstIncome.id).consolidationParentTransactionId).not.toBeNull();
        expect(fetchTransactionById(secondIncome.id).consolidationParentTransactionId).not.toBeNull();
    });
});
