import { AccountTypeEnum, ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    expectConsolidationParent,
    expectRevertRemovedCanonical,
    expectSourceStateRestored,
    expectSourcesRestored,
    fetchLedgerBalances,
    fetchMovedSourceIds,
    fetchSingleCanonicalId,
    snapshotSourceState
} from '../harness/consolidation-revert-audit';
import { IBAN_BRIDGE_TRANSFER_MCC, parentConsolidationSource } from '../harness/iban-bridge-topology';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService, unconsolidationService } from '../harness/test-context';

import type { TransactionEntityInterface } from '@budgie/contracts';

const INCOME_DUPLICATE_AMOUNT = 500 * PRECISION;
const INCOME_DUPLICATE_OPERATED_AT = new Date('2026-05-20T18:38:00');
const WRONG_DESTINATION_AMOUNT = 40_000 * PRECISION;
const WRONG_DESTINATION_OPERATED_AT = new Date('2026-01-13T11:42:53');

const byTransactionId = (left: number, right: number): number => left - right;

const fetchIncomeDuplicateCanonicalId = (): number => fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

interface WrongDestinationFixtureInterface {
    readonly existingTransfer: TransactionEntityInterface;
    readonly income: TransactionEntityInterface;
    readonly realTargetAccountId: number;
    readonly sourceAccountId: number;
}

const seedWrongDestinationFixture = (): WrongDestinationFixtureInterface => {
    const transferMccId = testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC).id;
    const sourceAccount = testSeedService.account({ title: 'Fop UAH', type: AccountTypeEnum.BANK_SYNC });
    const inactiveTargetAccount = testSeedService.account({ title: 'Privat UAH', type: AccountTypeEnum.BANK_SYNC, isActive: false });
    const realTargetAccount = testSeedService.account({ title: 'Black UAH', type: AccountTypeEnum.BANK_SYNC });
    const existingTransfer = testSeedService.directTransfer({
        exchangeRate: 1,
        operatedAt: WRONG_DESTINATION_OPERATED_AT,
        sourceAccountId: sourceAccount.id,
        sourceAmount: WRONG_DESTINATION_AMOUNT,
        sourceEntryExchangeRate: 1,
        targetAccountId: inactiveTargetAccount.id,
        targetAmount: WRONG_DESTINATION_AMOUNT,
        toIban: null
    });
    testSeedService.updateTransaction(existingTransfer.id, { externalSource: ExternalSourceEnum.MONOBANK });
    const income = testSeedService.bankPairIncome(
        { externalId: 'wrong-destination-income', operatedAt: new Date(WRONG_DESTINATION_OPERATED_AT.getTime() + 1_000) },
        { accountId: realTargetAccount.id, amount: WRONG_DESTINATION_AMOUNT, mccCategoryId: transferMccId }
    );

    return {
        existingTransfer,
        income,
        realTargetAccountId: realTargetAccount.id,
        sourceAccountId: sourceAccount.id
    };
};

const seedExistingTransferIncomeDuplicateFixture = (consolidationType: TransactionConsolidationTypeEnum | null = null) => {
    const transferMccId = testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC).id;
    const sourceAccount = testSeedService.account({ title: 'Duplicate Source UAH', type: AccountTypeEnum.BANK_SYNC });
    const targetAccount = testSeedService.account({ title: 'Duplicate Target UAH', type: AccountTypeEnum.BANK_SYNC });
    const existingTransfer = testSeedService.directTransfer({
        consolidationType,
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
    it('nests the pre-existing transfer and the duplicate income under a generated canonical', async () => {
        const { duplicateIncome, existingTransfer, sourceAccount, targetAccount } = seedExistingTransferIncomeDuplicateFixture();
        const accountIds = [sourceAccount.id, targetAccount.id];

        const result = await runConsolidation();
        const canonicalId = fetchIncomeDuplicateCanonicalId();

        expect(result.consolidated).toBe(1);
        expect(canonicalId).not.toBe(existingTransfer.id);
        expectConsolidationParent(existingTransfer.id, canonicalId);
        expectConsolidationParent(duplicateIncome.id, canonicalId);
        expect(testQueryService.fetchTransactionById(existingTransfer.id).consolidationType).toBeNull();
        expect([...new Set(fetchMovedSourceIds(canonicalId))]).toEqual([existingTransfer.id, duplicateIncome.id].sort(byTransactionId));
        expect(await fetchLedgerBalances(accountIds)).toEqual([
            [sourceAccount.id, -INCOME_DUPLICATE_AMOUNT],
            [targetAccount.id, INCOME_DUPLICATE_AMOUNT]
        ]);
    });

    it('restores the pre-existing transfer and the duplicate income when the absorbed canonical is reverted', async () => {
        const { duplicateIncome, existingTransfer, sourceAccount, targetAccount } = seedExistingTransferIncomeDuplicateFixture();
        const accountIds = [sourceAccount.id, targetAccount.id];
        const stateBeforeConsolidation = snapshotSourceState([existingTransfer.id, duplicateIncome.id]);
        const balancesBeforeConsolidation = await fetchLedgerBalances(accountIds);

        await runConsolidation();
        const canonicalId = fetchIncomeDuplicateCanonicalId();
        await unconsolidationService.unconsolidateById(canonicalId, testDb);

        expectRevertRemovedCanonical(canonicalId, [existingTransfer.id, duplicateIncome.id]);
        expectSourceStateRestored(stateBeforeConsolidation);
        expect(balancesBeforeConsolidation).toEqual([
            [sourceAccount.id, -INCOME_DUPLICATE_AMOUNT],
            [targetAccount.id, INCOME_DUPLICATE_AMOUNT + INCOME_DUPLICATE_AMOUNT]
        ]);
        expect(await fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
    });

    it('keeps an externally sourced transfer that was absorbed in place when its legacy canonical is reverted', async () => {
        const { duplicateIncome, existingTransfer, sourceAccount, targetAccount } = seedExistingTransferIncomeDuplicateFixture(
            TransactionConsolidationTypeEnum.TRANSFER_PAIR
        );
        const accountIds = [sourceAccount.id, targetAccount.id];

        testSeedService.updateTransaction(existingTransfer.id, { externalSource: ExternalSourceEnum.MONOBANK });
        const stateBeforeAbsorb = snapshotSourceState([duplicateIncome.id]);
        const balancesBeforeAbsorb = await fetchLedgerBalances(accountIds);
        await parentConsolidationSource(duplicateIncome.id, existingTransfer.id);
        await unconsolidationService.unconsolidateById(existingTransfer.id, testDb);

        expect(testQueryService.fetchTransactionById(existingTransfer.id).consolidationType).toBeNull();
        expectSourcesRestored([duplicateIncome.id]);
        expectSourceStateRestored(stateBeforeAbsorb);
        expect(await fetchLedgerBalances(accountIds)).toEqual(balancesBeforeAbsorb);
    });

    it('retargets a monobank transfer to the unique matching income account when the recorded destination is inactive', async () => {
        const { existingTransfer, income, realTargetAccountId, sourceAccountId } = seedWrongDestinationFixture();

        const result = await runConsolidation();
        const canonicalId = fetchIncomeDuplicateCanonicalId();

        expect(result.consolidated).toBe(1);
        const canonical = testQueryService.fetchTransactionById(canonicalId);
        expect(canonical.fromAccountId).toBe(sourceAccountId);
        expect(canonical.toAccountId).toBe(realTargetAccountId);
        expectConsolidationParent(existingTransfer.id, canonicalId);
        expectConsolidationParent(income.id, canonicalId);
        expect(await fetchLedgerBalances([sourceAccountId, realTargetAccountId])).toEqual([
            [sourceAccountId, -WRONG_DESTINATION_AMOUNT],
            [realTargetAccountId, WRONG_DESTINATION_AMOUNT]
        ]);
    });

    it('keeps retarget results stable when consolidation runs twice', async () => {
        seedWrongDestinationFixture();

        await runConsolidation();
        await expectSecondConsolidationRunStable();
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });
});
