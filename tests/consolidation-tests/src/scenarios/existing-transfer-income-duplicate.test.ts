import { AccountTypeEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    expectConsolidationParent,
    expectSourcesRestored,
    fetchLedgerBalances,
    fetchMovedSourceIds
} from '../harness/consolidation-revert-audit';
import { IBAN_BRIDGE_TRANSFER_MCC } from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService, unconsolidationService } from '../harness/test-context';

const INCOME_DUPLICATE_AMOUNT = 500 * PRECISION;
const INCOME_DUPLICATE_OPERATED_AT = new Date('2026-05-20T18:38:00');

const seedExistingTransferIncomeDuplicateFixture = () => {
    const transferMccId = testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC).id;
    const sourceAccount = testSeedService.account({ title: 'Duplicate Source UAH', type: AccountTypeEnum.BANK_SYNC });
    const targetAccount = testSeedService.account({ title: 'Duplicate Target UAH', type: AccountTypeEnum.BANK_SYNC });
    const existingTransfer = testSeedService.directTransfer({
        consolidationType: null,
        exchangeRate: 1,
        operatedAt: INCOME_DUPLICATE_OPERATED_AT,
        sourceAccountId: sourceAccount.id,
        sourceAmount: INCOME_DUPLICATE_AMOUNT,
        sourceEntryExchangeRate: 1,
        targetAccountId: targetAccount.id,
        targetAmount: INCOME_DUPLICATE_AMOUNT,
        toIban: null
    });
    const duplicateIncome = testSeedService.bankPairIncome(
        { externalId: 'duplicate-income', operatedAt: INCOME_DUPLICATE_OPERATED_AT },
        { accountId: targetAccount.id, amount: INCOME_DUPLICATE_AMOUNT, mccCategoryId: transferMccId }
    );

    return { duplicateIncome, existingTransfer, sourceAccount, targetAccount };
};

describe('consolidation/existing-transfer-income-duplicate', () => {
    it('absorbs the duplicate income into the pre-existing transfer and retypes it', async () => {
        const { duplicateIncome, existingTransfer, sourceAccount, targetAccount } = seedExistingTransferIncomeDuplicateFixture();
        const accountIds = [sourceAccount.id, targetAccount.id];

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expectConsolidationParent(duplicateIncome.id, existingTransfer.id);
        expect(testQueryService.fetchTransactionById(existingTransfer.id).consolidationType).toBe(
            TransactionConsolidationTypeEnum.TRANSFER_PAIR
        );
        expect(fetchMovedSourceIds(existingTransfer.id)).toEqual([duplicateIncome.id]);
        expect(await fetchLedgerBalances(accountIds)).toEqual([
            [sourceAccount.id, -INCOME_DUPLICATE_AMOUNT],
            [targetAccount.id, INCOME_DUPLICATE_AMOUNT]
        ]);
    });

    it('deletes the pre-existing transfer instead of restoring it when the absorbed income duplicate is reverted', async () => {
        const { duplicateIncome, existingTransfer, sourceAccount, targetAccount } = seedExistingTransferIncomeDuplicateFixture();
        const accountIds = [sourceAccount.id, targetAccount.id];
        const balancesBeforeConsolidation = await fetchLedgerBalances(accountIds);

        await runConsolidation();
        await unconsolidationService.unconsolidateById(existingTransfer.id, testDb);

        expectSourcesRestored([duplicateIncome.id]);
        expect(testQueryService.findTransactionById(existingTransfer.id)).toBeUndefined();
        expect(balancesBeforeConsolidation).toEqual([
            [sourceAccount.id, -INCOME_DUPLICATE_AMOUNT],
            [targetAccount.id, INCOME_DUPLICATE_AMOUNT + INCOME_DUPLICATE_AMOUNT]
        ]);
        expect(await fetchLedgerBalances(accountIds)).toEqual([
            [sourceAccount.id, 0],
            [targetAccount.id, INCOME_DUPLICATE_AMOUNT]
        ]);
    });
});
