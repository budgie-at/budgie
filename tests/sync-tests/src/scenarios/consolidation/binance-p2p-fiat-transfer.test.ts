import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { fetchCanonicalsOfType, fetchTransactionById, seedBankPair, seedP2pFiatTransferFixture } from '../../harness';

import type { TransactionEntityInterface } from '@budgie/contracts';

const UAH_TOTAL = 4_000 * PRECISION;
const USDT_AMOUNT = 100 * PRECISION;
const P2P_OPERATED_AT = new Date(2026, 0, 15, 12, 0, 0);
const BANK_LEG_OFFSET_MS = 2 * 60 * 1000;
const OUT_OF_WINDOW_OFFSET_MS = 3 * 60 * 60 * 1000;

interface P2pLeg {
    readonly externalId: string;
    readonly accountId: number;
    readonly amount: number;
}

const seedP2pPair = (
    expenseLeg: P2pLeg,
    incomeLeg: P2pLeg,
    incomeOffsetMs = BANK_LEG_OFFSET_MS
): { expense: TransactionEntityInterface; income: TransactionEntityInterface } => {
    const expense = seedBankPair.expense(
        { externalId: expenseLeg.externalId, operatedAt: P2P_OPERATED_AT },
        { accountId: expenseLeg.accountId, amount: expenseLeg.amount }
    );
    const income = seedBankPair.income(
        { externalId: incomeLeg.externalId, operatedAt: new Date(P2P_OPERATED_AT.getTime() + incomeOffsetMs) },
        { accountId: incomeLeg.accountId, amount: incomeLeg.amount }
    );

    return { expense, income };
};

const expectConsolidatedToP2pCanonical = (
    expense: TransactionEntityInterface,
    income: TransactionEntityInterface,
    fromAccountId: number,
    toAccountId: number
): void => {
    const [canonical] = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);
    expect(canonical?.fromAccountId).toBe(fromAccountId);
    expect(canonical?.toAccountId).toBe(toAccountId);
    expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonical?.id);
    expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonical?.id);
};

describe('consolidation/binance-p2p-fiat-transfer', () => {
    it('auto-consolidates a bank UAH expense with a Binance USDT P2P top-up income via a triangulated rate', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const { expense, income } = seedP2pPair(
            { externalId: 'mono-uah-p2p-out', accountId: bankAccount.id, amount: UAH_TOTAL },
            { externalId: 'binance:c2c:buy-1', accountId: binanceAccount.id, amount: USDT_AMOUNT }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expectConsolidatedToP2pCanonical(expense, income, bankAccount.id, binanceAccount.id);
    });

    it('auto-consolidates a Binance USDT P2P sell expense with a bank UAH cash-out income', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const { expense, income } = seedP2pPair(
            { externalId: 'binance:c2c:sell-1', accountId: binanceAccount.id, amount: USDT_AMOUNT },
            { externalId: 'mono-uah-p2p-in', accountId: bankAccount.id, amount: UAH_TOTAL }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expectConsolidatedToP2pCanonical(expense, income, binanceAccount.id, bankAccount.id);
    });

    it('does not consolidate a pair whose implied rate is far from the market rate', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        seedP2pPair(
            { externalId: 'mono-uah-off-rate', accountId: bankAccount.id, amount: 8_000 * PRECISION },
            { externalId: 'binance:c2c:buy-off-rate', accountId: binanceAccount.id, amount: USDT_AMOUNT }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(0);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });

    it('does not consolidate a correctly-priced pair that falls outside the time window', async () => {
        const { bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        seedP2pPair(
            { externalId: 'mono-uah-late', accountId: bankAccount.id, amount: UAH_TOTAL },
            { externalId: 'binance:c2c:buy-late', accountId: binanceAccount.id, amount: USDT_AMOUNT },
            OUT_OF_WINDOW_OFFSET_MS
        );

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(0);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });

    it('consolidates a P2P top-up from any synced crypto exchange, not only Binance', async () => {
        const { bankAccount, binanceAccount: exchangeAccount } = await seedP2pFiatTransferFixture();
        const { expense, income } = seedP2pPair(
            { externalId: 'mono-uah-okx-out', accountId: bankAccount.id, amount: UAH_TOTAL },
            { externalId: 'okx:c2c:buy-1', accountId: exchangeAccount.id, amount: USDT_AMOUNT }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });
        expectConsolidatedToP2pCanonical(expense, income, bankAccount.id, exchangeAccount.id);
    });
});
