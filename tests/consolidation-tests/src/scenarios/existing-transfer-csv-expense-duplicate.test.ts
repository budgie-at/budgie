import {
    AccountTypeEnum,
    ExternalSourceEnum,
    PRECISION,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { expectConsolidationParent, fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService } from '../harness/test-context';

const LEGACY_AMOUNT = 5943 * PRECISION;
const SYNCED_AMOUNT = Math.round(5870.2 * PRECISION);
const LEGACY_EUR_AMOUNT = 616 * PRECISION;
const OPERATED_AT = new Date('2025-10-21T10:00:00');

const seedLegacyCsvTransfer = (sourceInstrumentId: number, sourceAmount: number, isTargetActive: boolean) => {
    const legacySourceAccount = testSeedService.account({
        title: 'monobank',
        type: AccountTypeEnum.BANK,
        instrumentId: sourceInstrumentId
    });
    const legacyTargetAccount = testSeedService.account({ title: 'приватбанк UAH', type: AccountTypeEnum.BANK, isActive: isTargetActive });
    const syncedCardAccount = testSeedService.bankSyncAccount('Monobank Black •3126', ExternalSourceEnum.MONOBANK, null);
    const legacyTransfer = testSeedService.directTransfer({
        exchangeRate: sourceAmount / LEGACY_AMOUNT,
        operatedAt: OPERATED_AT,
        sourceAccountId: legacySourceAccount.id,
        sourceAmount,
        sourceEntryExchangeRate: 1,
        targetAccountId: legacyTargetAccount.id,
        targetAmount: LEGACY_AMOUNT,
        title: '',
        toIban: null
    });

    testSeedService.updateTransaction(legacyTransfer.id, { externalSource: ExternalSourceEnum.CSV });
    testDb
        .update(TransactionEntryEntityTable)
        .set({ deletedAt: new Date('2026-01-01') })
        .where(
            and(
                eq(TransactionEntryEntityTable.transactionId, legacyTransfer.id),
                eq(TransactionEntryEntityTable.accountId, legacySourceAccount.id)
            )
        )
        .run();

    return { legacySourceAccount, legacyTargetAccount, legacyTransfer, syncedCardAccount };
};

const seedSyncedExpense = (accountId: number, amount: number, title: string, mcc = '4829') => {
    const expense = testSeedService.bankPairExpense(
        { externalId: `synced-${title}`, operatedAt: new Date(OPERATED_AT.getTime() + 14_000) },
        { accountId, amount, mccCategoryId: testQueryService.findMccByCode(mcc).id }
    );

    return testSeedService.updateTransaction(expense.id, { title });
};

describe('consolidation/existing-transfer-csv-expense-duplicate', () => {
    it('pairs a synced expense with the rounded source leg of a legacy CSV transfer to an inactive account', async () => {
        const { legacyTargetAccount, legacyTransfer, syncedCardAccount } = seedLegacyCsvTransfer(1, LEGACY_AMOUNT, false);
        const expense = seedSyncedExpense(syncedCardAccount.id, SYNCED_AMOUNT, 'приват сина 3');

        const result = await runConsolidation();
        const [canonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        expect(result.consolidated).toBe(1);
        expect(canonical.title).toBe('приват сина 3');
        expect(canonical.fromAccountId).toBe(syncedCardAccount.id);
        expect(canonical.toAccountId).toBe(legacyTargetAccount.id);
        expectConsolidationParent(legacyTransfer.id, canonical.id);
        expectConsolidationParent(expense.id, canonical.id);
        expect(await fetchLedgerBalances([syncedCardAccount.id, legacyTargetAccount.id])).toEqual([
            [syncedCardAccount.id, -SYNCED_AMOUNT],
            [legacyTargetAccount.id, LEGACY_AMOUNT]
        ]);
        await expectSecondConsolidationRunStable();
    });

    it('matches the target leg when the legacy source account holds another currency', async () => {
        const eur = testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
        const { legacyTargetAccount, legacyTransfer, syncedCardAccount } = seedLegacyCsvTransfer(eur.id, LEGACY_EUR_AMOUNT, true);
        const expense = seedSyncedExpense(syncedCardAccount.id, LEGACY_AMOUNT, '552324****0356');

        expect((await runConsolidation()).consolidated).toBe(1);
        const [canonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonical.toAccountId).toBe(legacyTargetAccount.id);
        expectConsolidationParent(legacyTransfer.id, canonical.id);
        expectConsolidationParent(expense.id, canonical.id);
    });

    it('keeps the expense when the legacy source leg is still live on an active account', async () => {
        const { legacySourceAccount, legacyTransfer, syncedCardAccount } = seedLegacyCsvTransfer(1, LEGACY_AMOUNT, false);
        const expense = seedSyncedExpense(syncedCardAccount.id, LEGACY_AMOUNT, 'приват сина 3');

        testDb
            .update(TransactionEntryEntityTable)
            .set({ deletedAt: null })
            .where(
                and(
                    eq(TransactionEntryEntityTable.transactionId, legacyTransfer.id),
                    eq(TransactionEntryEntityTable.accountId, legacySourceAccount.id)
                )
            )
            .run();

        expect(await runConsolidation()).toEqual({ consolidated: 0, found: 0 });
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();
    });

    it.each([
        ['На картку', Math.round(LEGACY_AMOUNT * 1.03), '4829'],
        ['Олексій Т.', Math.round(LEGACY_AMOUNT * 0.9), '4829'],
        ['Платіж COMFY', Math.round(LEGACY_AMOUNT * 1.1), '4829'],
        ['Переказ на картку', LEGACY_AMOUNT, '5411']
    ])('keeps "%s" as an expense when it does not duplicate the legacy leg', async (title, amount, mcc) => {
        const { syncedCardAccount } = seedLegacyCsvTransfer(1, LEGACY_AMOUNT, false);
        const expense = seedSyncedExpense(syncedCardAccount.id, amount, title, mcc);

        expect(await runConsolidation()).toEqual({ consolidated: 0, found: 0 });
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();
    });
});
