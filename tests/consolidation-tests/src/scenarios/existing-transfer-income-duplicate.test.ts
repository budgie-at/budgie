import { AccountTypeEnum, ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

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
import { testQueryService, testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';


const INCOME_DUPLICATE_AMOUNT = 500 * PRECISION;
const INCOME_DUPLICATE_OPERATED_AT = new Date('2026-05-20T18:38:00');
const WRONG_DESTINATION_AMOUNT = 40_000 * PRECISION;
const WRONG_DESTINATION_OPERATED_AT = new Date('2026-01-13T11:42:53');

const byTransactionId = (left: number, right: number): number => left - right;

const fetchIncomeDuplicateCanonicalId = () =>
    Effect.gen(function* () {
        return yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
    });

const seedWrongDestinationFixture = () =>
    Effect.gen(function* () {
        const transferMccId = (yield* testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC)).id;
        const sourceAccount = yield* testSeedService.account({ title: 'Fop UAH', type: AccountTypeEnum.BANK_SYNC });
        const inactiveTargetAccount = yield* testSeedService.account({
            title: 'Privat UAH',
            type: AccountTypeEnum.BANK_SYNC,
            isActive: false
        });
        const realTargetAccount = yield* testSeedService.account({ title: 'Black UAH', type: AccountTypeEnum.BANK_SYNC });
        const existingTransfer = yield* testSeedService.directTransfer({
            exchangeRate: 1,
            operatedAt: WRONG_DESTINATION_OPERATED_AT,
            sourceAccountId: sourceAccount.id,
            sourceAmount: WRONG_DESTINATION_AMOUNT,
            sourceEntryExchangeRate: 1,
            targetAccountId: inactiveTargetAccount.id,
            targetAmount: WRONG_DESTINATION_AMOUNT,
            toIban: null
        });
        yield* testSeedService.updateTransaction(existingTransfer.id, { externalSource: ExternalSourceEnum.MONOBANK });
        const income = yield* testSeedService.bankPairIncome(
            { externalId: 'wrong-destination-income', operatedAt: new Date(WRONG_DESTINATION_OPERATED_AT.getTime() + 1_000) },
            { accountId: realTargetAccount.id, amount: WRONG_DESTINATION_AMOUNT, mccCategoryId: transferMccId }
        );

        return {
            existingTransfer,
            income,
            realTargetAccountId: realTargetAccount.id,
            sourceAccountId: sourceAccount.id
        };
    });

const seedExistingTransferIncomeDuplicateFixture = (consolidationType: TransactionConsolidationTypeEnum | null = null) =>
    Effect.gen(function* () {
        const transferMccId = (yield* testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC)).id;
        const sourceAccount = yield* testSeedService.account({ title: 'Duplicate Source UAH', type: AccountTypeEnum.BANK_SYNC });
        const targetAccount = yield* testSeedService.account({ title: 'Duplicate Target UAH', type: AccountTypeEnum.BANK_SYNC });
        const existingTransfer = yield* testSeedService.directTransfer({
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
        const duplicateIncome = yield* testSeedService.bankPairIncome(
            { externalId: 'duplicate-income', operatedAt: INCOME_DUPLICATE_OPERATED_AT },
            { accountId: targetAccount.id, amount: INCOME_DUPLICATE_AMOUNT, mccCategoryId: transferMccId }
        );

        return { duplicateIncome, existingTransfer, sourceAccount, targetAccount };
    });

layer(TestLayer)('consolidation/existing-transfer-income-duplicate', it => {
    it.effect('nests the pre-existing transfer and the duplicate income under a generated canonical', () =>
        Effect.gen(function* () {
            const { duplicateIncome, existingTransfer, sourceAccount, targetAccount } = yield* seedExistingTransferIncomeDuplicateFixture();
            const accountIds = [sourceAccount.id, targetAccount.id];

            const result = yield* runConsolidation();
            const canonicalId = yield* fetchIncomeDuplicateCanonicalId();

            expect(result.consolidated).toBe(1);
            expect(canonicalId).not.toBe(existingTransfer.id);
            yield* expectConsolidationParent(existingTransfer.id, canonicalId);
            yield* expectConsolidationParent(duplicateIncome.id, canonicalId);
            expect((yield* testQueryService.fetchTransactionById(existingTransfer.id)).consolidationType).toBeNull();
            expect([...new Set(yield* fetchMovedSourceIds(canonicalId))]).toEqual(
                [existingTransfer.id, duplicateIncome.id].sort(byTransactionId)
            );
            expect(yield* fetchLedgerBalances(accountIds)).toEqual([
                [sourceAccount.id, -INCOME_DUPLICATE_AMOUNT],
                [targetAccount.id, INCOME_DUPLICATE_AMOUNT]
            ]);
        })
    );

    it.effect('restores the pre-existing transfer and the duplicate income when the absorbed canonical is reverted', () =>
        Effect.gen(function* () {
            const { duplicateIncome, existingTransfer, sourceAccount, targetAccount } = yield* seedExistingTransferIncomeDuplicateFixture();
            const accountIds = [sourceAccount.id, targetAccount.id];
            const stateBeforeConsolidation = yield* snapshotSourceState([existingTransfer.id, duplicateIncome.id]);
            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);

            yield* runConsolidation();
            const canonicalId = yield* fetchIncomeDuplicateCanonicalId();
            yield* unconsolidateById(canonicalId);

            yield* expectRevertRemovedCanonical(canonicalId, [existingTransfer.id, duplicateIncome.id]);
            yield* expectSourceStateRestored(stateBeforeConsolidation);
            expect(balancesBeforeConsolidation).toEqual([
                [sourceAccount.id, -INCOME_DUPLICATE_AMOUNT],
                [targetAccount.id, INCOME_DUPLICATE_AMOUNT + INCOME_DUPLICATE_AMOUNT]
            ]);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
        })
    );

    it.effect('keeps an externally sourced transfer that was absorbed in place when its legacy canonical is reverted', () =>
        Effect.gen(function* () {
            const { duplicateIncome, existingTransfer, sourceAccount, targetAccount } = yield* seedExistingTransferIncomeDuplicateFixture(
                TransactionConsolidationTypeEnum.TRANSFER_PAIR
            );
            const accountIds = [sourceAccount.id, targetAccount.id];

            yield* testSeedService.updateTransaction(existingTransfer.id, { externalSource: ExternalSourceEnum.MONOBANK });
            const stateBeforeAbsorb = yield* snapshotSourceState([duplicateIncome.id]);
            const balancesBeforeAbsorb = yield* fetchLedgerBalances(accountIds);
            yield* parentConsolidationSource(duplicateIncome.id, existingTransfer.id);
            yield* unconsolidateById(existingTransfer.id);

            expect((yield* testQueryService.fetchTransactionById(existingTransfer.id)).consolidationType).toBeNull();
            yield* expectSourcesRestored([duplicateIncome.id]);
            yield* expectSourceStateRestored(stateBeforeAbsorb);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeAbsorb);
        })
    );

    it.effect('retargets a monobank transfer to the unique matching income account when the recorded destination is inactive', () =>
        Effect.gen(function* () {
            const { existingTransfer, income, realTargetAccountId, sourceAccountId } = yield* seedWrongDestinationFixture();

            const result = yield* runConsolidation();
            const canonicalId = yield* fetchIncomeDuplicateCanonicalId();

            expect(result.consolidated).toBe(1);
            const canonical = yield* testQueryService.fetchTransactionById(canonicalId);
            expect(canonical.fromAccountId).toBe(sourceAccountId);
            expect(canonical.toAccountId).toBe(realTargetAccountId);
            yield* expectConsolidationParent(existingTransfer.id, canonicalId);
            yield* expectConsolidationParent(income.id, canonicalId);
            expect(yield* fetchLedgerBalances([sourceAccountId, realTargetAccountId])).toEqual([
                [sourceAccountId, -WRONG_DESTINATION_AMOUNT],
                [realTargetAccountId, WRONG_DESTINATION_AMOUNT]
            ]);
        })
    );

    it.effect('keeps retarget results stable when consolidation runs twice', () =>
        Effect.gen(function* () {
            yield* seedWrongDestinationFixture();

            yield* runConsolidation();
            yield* expectSecondConsolidationRunStable();
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
        })
    );
});
