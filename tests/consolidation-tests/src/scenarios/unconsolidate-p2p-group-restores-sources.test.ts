import { P2pFiatDirectionEnum } from '@budgie/consolidation';
import { AccountTypeEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { consolidationExecutorService, testDb, testQueryService, testSeedService, unconsolidationService } from '../harness/test-context';

const OPERATED_AT = new Date('2026-01-15T12:00:00.000Z');
const FIRST_EXPENSE_AMOUNT = Number('1534') * PRECISION;
const SECOND_EXPENSE_AMOUNT = Number('6640') * PRECISION;
const TOTAL_EXPENSE_AMOUNT = FIRST_EXPENSE_AMOUNT + SECOND_EXPENSE_AMOUNT;
const INCOME_AMOUNT = Number('187.21') * PRECISION;
const SECOND_EXPENSE_OFFSET_MS = 30_000;
const INCOME_OFFSET_MS = 60_000;

const seedGroupedP2pSources = () => {
    const usdt = testSeedService.instrument({ code: 'USDT', name: 'Tether', symbol: 'USDT' });
    const bankAccount = testSeedService.account({ externalId: 'mono-white-p2p', type: AccountTypeEnum.BANK_SYNC });
    const binanceAccount = testSeedService.account({
        externalId: 'binance-funding-usdt',
        type: AccountTypeEnum.CRYPTO_SYNC,
        instrumentId: usdt.id
    });
    const firstExpense = testSeedService.bankPairExpense(
        { externalId: 'mono-p2p-expense-a', operatedAt: OPERATED_AT },
        { accountId: bankAccount.id, amount: FIRST_EXPENSE_AMOUNT }
    );
    const secondExpense = testSeedService.bankPairExpense(
        { externalId: 'mono-p2p-expense-b', operatedAt: new Date(OPERATED_AT.getTime() + SECOND_EXPENSE_OFFSET_MS) },
        { accountId: bankAccount.id, amount: SECOND_EXPENSE_AMOUNT }
    );
    const income = testSeedService.bankPairIncome(
        { externalId: 'binance:c2c:grouped-buy', operatedAt: new Date(OPERATED_AT.getTime() + INCOME_OFFSET_MS) },
        { accountId: binanceAccount.id, amount: INCOME_AMOUNT }
    );

    return { bankAccount, binanceAccount, firstExpense, secondExpense, income };
};

describe('consolidation/unconsolidate-p2p-group-restores-sources', () => {
    it('restores every source from a grouped P2P transfer and allows reconsolidation', async () => {
        const { bankAccount, binanceAccount, firstExpense, secondExpense, income } = seedGroupedP2pSources();
        const candidate = {
            sourceTransactionIds: [firstExpense.id, secondExpense.id, income.id],
            bankTransactionIds: [firstExpense.id, secondExpense.id],
            p2pTransactionId: income.id,
            direction: P2pFiatDirectionEnum.BUY,
            assetCode: 'USDT',
            operatedAt: Math.floor(OPERATED_AT.getTime() / 1000),
            fromAccountId: bankAccount.id,
            toAccountId: binanceAccount.id,
            fromAmount: TOTAL_EXPENSE_AMOUNT,
            toAmount: INCOME_AMOUNT,
            fromEntryExchangeRate: 1,
            toEntryExchangeRate: 1,
            fromEntryToIban: null,
            rateDifference: 0,
            maximumTimeDifference: 60
        };

        expect(await consolidationExecutorService.consolidateP2pFiatTransfer(candidate)).toBe(true);

        const [canonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);
        expect(canonical).toBeDefined();

        await unconsolidationService.unconsolidateById(canonical.id, testDb);

        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);

        for (const sourceTransaction of [firstExpense, secondExpense, income]) {
            expect(testQueryService.fetchTransactionById(sourceTransaction.id).consolidationParentTransactionId).toBeNull();
            expect(testQueryService.fetchEntryByExternalId(sourceTransaction.externalId ?? '').transactionId).toBe(sourceTransaction.id);
        }

        expect(await consolidationExecutorService.consolidateP2pFiatTransfer(candidate)).toBe(true);
    });
});
