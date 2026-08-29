import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import {
    AccountEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { getDefined } from '@rnw-community/shared';

import {
    P2P_OPERATED_AT,
    P2P_UAH_TOTAL,
    P2P_USDT_AMOUNT,
    fetchTransactionById,
    seed,
    seedBankPair,
    seedP2pFiatTransferFixture,
    seedP2pIncome,
    testDb
} from '../../harness';

const REPAIR_PRIMARY_AMOUNT = 3_500 * PRECISION;
const REPAIR_EXTRA_AMOUNT = 500 * PRECISION;
const REPAIR_WRONG_AMOUNT = REPAIR_PRIMARY_AMOUNT + REPAIR_EXTRA_AMOUNT;
const REPAIR_SCOPE_WINDOW_MS = 60_000;

const backfillP2pQuote = (quotedInstrumentId: number, incomeTransactionId: number): void => {
    testDb
        .update(TransactionEntryEntityTable)
        .set({
            quotedInstrumentId,
            quotedAmount: REPAIR_PRIMARY_AMOUNT,
            quotedUnitPrice: 35 * PRECISION
        })
        .where(eq(TransactionEntryEntityTable.originalTransactionId, incomeTransactionId))
        .run();
};

const seedWrongP2pRepairScenario = (externalIdPrefix: string, bankAccountId: number, binanceAccountId: number) => {
    const wrongExpense = seedBankPair.expense(
        { externalId: `mono-uah-repair-${externalIdPrefix}-wrong`, operatedAt: P2P_OPERATED_AT },
        { accountId: bankAccountId, amount: REPAIR_WRONG_AMOUNT }
    );
    const correctExpense = seedBankPair.expense(
        { externalId: `mono-uah-repair-${externalIdPrefix}-correct`, operatedAt: P2P_OPERATED_AT },
        { accountId: bankAccountId, amount: REPAIR_PRIMARY_AMOUNT }
    );
    const income = seedP2pIncome(`binance:c2c:buy-repair-${externalIdPrefix}`, binanceAccountId);

    return { wrongExpense, correctExpense, income };
};

const consolidateWrongP2pRepairScenario = async (wrongExpenseId: number, incomeTransactionId: number): Promise<number> => {
    expect((await transferConsolidationService.consolidate()).consolidated).toBe(1);

    const canonicalId = getDefined(fetchTransactionById(incomeTransactionId).consolidationParentTransactionId, () => {
        throw new Error('Expected heuristic P2P canonical id');
    });

    expect(fetchTransactionById(wrongExpenseId).consolidationParentTransactionId).toBe(canonicalId);

    return canonicalId;
};

const consolidateP2pRepairWithScope = (transactionIds: readonly number[]) =>
    transferConsolidationService.consolidate({
        operatedAtFrom: new Date(P2P_OPERATED_AT.getTime() - REPAIR_SCOPE_WINDOW_MS),
        operatedAtTo: new Date(P2P_OPERATED_AT.getTime() + REPAIR_SCOPE_WINDOW_MS),
        transactionIds
    });

const backfillAndConsolidateScopedP2pRepair = (
    quotedInstrumentId: number,
    incomeTransactionId: number,
    transactionIds: readonly number[]
) => {
    backfillP2pQuote(quotedInstrumentId, incomeTransactionId);

    return consolidateP2pRepairWithScope(transactionIds);
};

const expectRepairCanonicalPreserved = (canonicalId: number, transactionIds: readonly number[]): void => {
    transactionIds.forEach(transactionId => {
        expect(fetchTransactionById(transactionId).consolidationParentTransactionId).toBe(canonicalId);
    });
};

describe('consolidation/binance-p2p-fiat-transfer authoritative repair', () => {
    it('repairs a system-generated group after provider fiat data is backfilled', async () => {
        const { uah, bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const primaryExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-primary', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
        );
        const extraExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-extra', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: REPAIR_EXTRA_AMOUNT }
        );
        const income = seedP2pIncome('binance:c2c:buy-repair', binanceAccount.id);

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(1);
        expect(fetchTransactionById(extraExpense.id).consolidationParentTransactionId).not.toBeNull();

        backfillP2pQuote(uah.id, income.id);

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(1);
        expect(fetchTransactionById(primaryExpense.id).consolidationParentTransactionId).toBe(
            fetchTransactionById(income.id).consolidationParentTransactionId
        );
        expect(fetchTransactionById(extraExpense.id).consolidationParentTransactionId).toBeNull();
    });

    it('repairs a system-generated 1:1 heuristic match after provider fiat data is backfilled', async () => {
        const { uah, bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const { wrongExpense, correctExpense, income } = seedWrongP2pRepairScenario('1-to-1', bankAccount.id, binanceAccount.id);

        await consolidateWrongP2pRepairScenario(wrongExpense.id, income.id);
        expect(fetchTransactionById(correctExpense.id).consolidationParentTransactionId).toBeNull();

        backfillP2pQuote(uah.id, income.id);

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(1);
        expect(fetchTransactionById(correctExpense.id).consolidationParentTransactionId).toBe(
            fetchTransactionById(income.id).consolidationParentTransactionId
        );
        expect(fetchTransactionById(wrongExpense.id).consolidationParentTransactionId).toBeNull();
    });

    it('preserves a user-edited 1:1 heuristic match after provider fiat data is backfilled', async () => {
        const { uah, bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const { wrongExpense, correctExpense, income } = seedWrongP2pRepairScenario('user-1-to-1', bankAccount.id, binanceAccount.id);
        const canonicalId = await consolidateWrongP2pRepairScenario(wrongExpense.id, income.id);

        testDb
            .update(TransactionEntityTable)
            .set({ updatedBy: TransactionUpdatedByEnum.USER })
            .where(eq(TransactionEntityTable.id, canonicalId))
            .run();
        backfillP2pQuote(uah.id, income.id);

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(0);
        expectRepairCanonicalPreserved(canonicalId, [wrongExpense.id, income.id]);
        expect(fetchTransactionById(correctExpense.id).consolidationParentTransactionId).toBeNull();
    });
});

describe('consolidation/binance-p2p-fiat-transfer existing source scope', () => {
    it('does not repair a same-window canonical whose source ids are out of scoped scan ids', async () => {
        const { uah, bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const historicalPrimaryExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-scoped-primary', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
        );
        const historicalExtraExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-scoped-extra', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: REPAIR_EXTRA_AMOUNT }
        );
        const historicalIncome = seedP2pIncome('binance:c2c:buy-repair-scoped', binanceAccount.id);

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(1);
        expect(fetchTransactionById(historicalExtraExpense.id).consolidationParentTransactionId).not.toBeNull();

        const historicalCanonicalId = getDefined(fetchTransactionById(historicalIncome.id).consolidationParentTransactionId, () => {
            throw new Error('Expected historical P2P canonical id');
        });

        backfillP2pQuote(uah.id, historicalIncome.id);

        const scopedExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-scoped-current-expense', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
        );
        const scopedIncome = seedBankPair.income(
            { externalId: 'binance:c2c:buy-repair-scoped-current-income', operatedAt: P2P_OPERATED_AT },
            { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
        );

        expect(await consolidateP2pRepairWithScope([scopedExpense.id, scopedIncome.id])).toEqual({ found: 1, consolidated: 1 });
        expectRepairCanonicalPreserved(historicalCanonicalId, [
            historicalPrimaryExpense.id,
            historicalExtraExpense.id,
            historicalIncome.id
        ]);
    });
});

describe('consolidation/binance-p2p-fiat-transfer grouped source scope', () => {
    it('does not repair a grouped canonical when only a separate replacement-like bank source id is scoped', async () => {
        const { uah, bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const historicalPrimaryExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-grouped-source-primary', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
        );
        const historicalExtraExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-grouped-source-extra', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: REPAIR_EXTRA_AMOUNT }
        );
        const historicalIncome = seedP2pIncome('binance:c2c:buy-repair-grouped-source', binanceAccount.id);

        expect((await transferConsolidationService.consolidate()).consolidated).toBe(1);

        const historicalCanonicalId = getDefined(fetchTransactionById(historicalIncome.id).consolidationParentTransactionId, () => {
            throw new Error('Expected grouped repair canonical id');
        });

        backfillP2pQuote(uah.id, historicalIncome.id);

        const scopedReplacementLikeExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-grouped-source-unrelated-replacement', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
        );

        expect(await consolidateP2pRepairWithScope([scopedReplacementLikeExpense.id])).toEqual({ found: 0, consolidated: 0 });
        expectRepairCanonicalPreserved(historicalCanonicalId, [
            historicalPrimaryExpense.id,
            historicalExtraExpense.id,
            historicalIncome.id
        ]);
        expect(fetchTransactionById(scopedReplacementLikeExpense.id).consolidationParentTransactionId).toBeNull();
    });
});

describe('consolidation/binance-p2p-fiat-transfer replacement source scope', () => {
    it('repairs a system-generated 1:1 heuristic match when only the replacement bank source id is scoped', async () => {
        const { uah, bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const { wrongExpense, correctExpense, income } = seedWrongP2pRepairScenario('replacement-scope', bankAccount.id, binanceAccount.id);

        await consolidateWrongP2pRepairScenario(wrongExpense.id, income.id);

        expect(await backfillAndConsolidateScopedP2pRepair(uah.id, income.id, [correctExpense.id])).toEqual({
            found: 1,
            consolidated: 1
        });
        expect(fetchTransactionById(correctExpense.id).consolidationParentTransactionId).toBe(
            fetchTransactionById(income.id).consolidationParentTransactionId
        );
        expect(fetchTransactionById(wrongExpense.id).consolidationParentTransactionId).toBeNull();
    });

    it('does not repair a system-generated 1:1 heuristic match through an inactive replacement bank account', async () => {
        const { uah, bankAccount, binanceAccount } = await seedP2pFiatTransferFixture();
        const inactiveBankAccount = seed.account({
            externalSource: ExternalSourceEnum.MONOBANK,
            instrumentId: uah.id,
            title: 'Inactive Monobank UAH',
            type: AccountTypeEnum.BANK_SYNC
        });
        const wrongExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-inactive-wrong', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: REPAIR_WRONG_AMOUNT }
        );
        const inactiveReplacementExpense = seedBankPair.expense(
            { externalId: 'mono-uah-repair-inactive-correct', operatedAt: P2P_OPERATED_AT },
            { accountId: inactiveBankAccount.id, amount: REPAIR_PRIMARY_AMOUNT }
        );
        const income = seedP2pIncome('binance:c2c:buy-repair-inactive', binanceAccount.id);

        testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, inactiveBankAccount.id)).run();

        const canonicalId = await consolidateWrongP2pRepairScenario(wrongExpense.id, income.id);

        expect(await backfillAndConsolidateScopedP2pRepair(uah.id, income.id, [income.id])).toEqual({
            found: 0,
            consolidated: 0
        });
        expectRepairCanonicalPreserved(canonicalId, [wrongExpense.id, income.id]);
        expect(fetchTransactionById(inactiveReplacementExpense.id).consolidationParentTransactionId).toBeNull();
    });
});
