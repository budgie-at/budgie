import { consolidationScopeService } from '@budgie/consolidation';
import {
    AccountBalanceRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntityInterface,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    expectSingleConsolidation,
    fetchCanonicalsOfType,
    fetchCachedBalanceAmount,
    fetchTransactionById,
    findMccByCode,
    seed,
    seedBankPair,
    seedBankSyncAccount,
    testDb,
    TestLayer
} from '../../harness';

const SOURCE_IBAN = 'UA-SOURCE-EUR';
const BRIDGE_IBAN = 'UA-BRIDGE-UAH';
const TARGET_IBAN = 'UA-TARGET-UAH';
const EUR_AMOUNT = 1_658_290_000;
const UAH_AMOUNT = 84_456_700_000;
const EUR_TO_UAH_RATE = UAH_AMOUNT / EUR_AMOUNT;
const UAH_TO_EUR_RATE = EUR_AMOUNT / UAH_AMOUNT;

const seedBridgeAccounts = () =>
    Effect.gen(function* () {
        const transferMcc = yield* findMccByCode('4829');
        const eur = yield* seed.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
        const sourceAccount = yield* seedBankSyncAccount('Monobank Fop EUR', null, SOURCE_IBAN, eur.id);
        const bridgeAccount = yield* seedBankSyncAccount('Monobank Fop UAH', null, BRIDGE_IBAN);
        const targetAccount = yield* seedBankSyncAccount('Monobank Black', null, TARGET_IBAN);

        return { transferMcc, sourceAccount, bridgeAccount, targetAccount };
    });

const seedBridgeRows = (operatedAt: Date, bridgeAccountId: number, transferMccId: number) =>
    Effect.gen(function* () {
        const bridgeIncome = yield* seedBankPair.income(
            { externalId: 'bridge-income', operatedAt },
            {
                accountId: bridgeAccountId,
                amount: UAH_AMOUNT,
                exchangeRate: EUR_TO_UAH_RATE,
                mccCategoryId: transferMccId,
                toIban: SOURCE_IBAN
            }
        );
        const bridgeExpense = yield* seedBankPair.expense(
            { externalId: 'bridge-expense', operatedAt },
            {
                accountId: bridgeAccountId,
                amount: UAH_AMOUNT,
                mccCategoryId: transferMccId,
                toIban: TARGET_IBAN
            }
        );

        return { bridgeIncome, bridgeExpense };
    });

const seedTargetIncome = (externalId: string, operatedAt: Date, targetAccountId: number, transferMccId: number) =>
    Effect.gen(function* () {
        return yield* seedBankPair.income(
            { externalId, operatedAt },
            {
                accountId: targetAccountId,
                amount: UAH_AMOUNT,
                mccCategoryId: transferMccId
            }
        );
    });

const seedDirectTransfer = (
    operatedAt: Date,
    sourceAccountId: number,
    targetAccountId: number,
    consolidationType: TransactionConsolidationTypeEnum | null = null
) =>
    Effect.gen(function* () {
        return yield* seed.directTransfer({
            consolidationType,
            exchangeRate: UAH_TO_EUR_RATE,
            operatedAt,
            sourceAccountId,
            sourceAmount: EUR_AMOUNT,
            sourceEntryExchangeRate: UAH_TO_EUR_RATE,
            targetAccountId,
            targetAmount: UAH_AMOUNT,
            toIban: TARGET_IBAN,
            title: 'На чорну картку'
        });
    });

const seedBridgeReclaimFixture = (consolidationType: TransactionConsolidationTypeEnum | null) =>
    Effect.gen(function* () {
        const operatedAt = new Date(2026, 4, 20, 18, 38, 0);
        const { transferMcc, sourceAccount, bridgeAccount, targetAccount } = yield* seedBridgeAccounts();
        const directTransfer = yield* seedDirectTransfer(operatedAt, sourceAccount.id, targetAccount.id, consolidationType);
        const { bridgeIncome, bridgeExpense } = yield* seedBridgeRows(operatedAt, bridgeAccount.id, transferMcc.id);

        return { bridgeExpense, bridgeIncome, directTransfer, sourceAccount, targetAccount };
    });

const buildBridgeScope = (transactions: Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]) => {
    const scope = consolidationScopeService.buildFromTransactions(transactions);

    if (!isDefined(scope)) {
        throw new Error('Expected bridge rows to build a consolidation scope');
    }

    return scope;
};

const fetchMovedSourceIds = (canonicalId: number) =>
    Effect.gen(function* () {
        const movedEntries = yield* testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, canonicalId));

        return movedEntries.flatMap(entry => (entry.originalTransactionId ? [entry.originalTransactionId] : []));
    });

const expectCanonicalTransfer = (consolidationType: TransactionConsolidationTypeEnum, sourceAccountId: number, targetAccountId: number) =>
    Effect.gen(function* () {
        expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);

        const canonicals = yield* fetchCanonicalsOfType(consolidationType);
        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].type).toBe(TransactionTypeEnum.TRANSFER);
        expect(canonicals[0].fromAccountId).toBe(sourceAccountId);
        expect(canonicals[0].toAccountId).toBe(targetAccountId);

        return canonicals[0].id;
    });

const expectSourcesParented = (canonicalId: number, sourceTransactionIds: number[]) =>
    Effect.gen(function* () {
        for (const sourceTransactionId of sourceTransactionIds) {
            expect((yield* fetchTransactionById(sourceTransactionId)).consolidationParentTransactionId).toBe(canonicalId);
        }
    });

const expectMovedSources = (canonicalId: number, expectedSourceIds: number[]) =>
    Effect.gen(function* () {
        const sourceIds = yield* fetchMovedSourceIds(canonicalId);

        expect(sourceIds.sort((left, right) => left - right)).toEqual(expectedSourceIds.sort((left, right) => left - right));
    });

const expectBridgeReclaimedIntoDirectTransfer = (
    directTransferId: number,
    sourceAccountId: number,
    targetAccountId: number,
    sourceIds: number[]
) =>
    Effect.gen(function* () {
        expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);

        const canonicalId = yield* expectCanonicalTransfer(
            TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
            sourceAccountId,
            targetAccountId
        );

        expect(canonicalId).toBe(directTransferId);
        yield* expectSourcesParented(canonicalId, sourceIds);
        yield* expectMovedSources(canonicalId, sourceIds);
    });

describe('consolidation/iban-bridge-chain-transfer', () => {
    it.effect('collapses a technical bridge chain into one direct canonical transfer', () =>
        Effect.gen(function* () {
            const operatedAt = new Date(2026, 4, 20, 18, 38, 0);
            const { transferMcc, sourceAccount, bridgeAccount, targetAccount } = yield* seedBridgeAccounts();
            const sourceExpense = yield* seedBankPair.expense(
                { externalId: 'source-expense', operatedAt },
                {
                    accountId: sourceAccount.id,
                    amount: EUR_AMOUNT,
                    exchangeRate: UAH_TO_EUR_RATE,
                    mccCategoryId: transferMcc.id,
                    toIban: TARGET_IBAN
                }
            );
            const { bridgeIncome, bridgeExpense } = yield* seedBridgeRows(operatedAt, bridgeAccount.id, transferMcc.id);
            const targetIncome = yield* seedTargetIncome('target-income', operatedAt, targetAccount.id, transferMcc.id);

            yield* expectSingleConsolidation();

            const canonicalId = yield* expectCanonicalTransfer(
                TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
                sourceAccount.id,
                targetAccount.id
            );
            const sourceIds = [sourceExpense.id, bridgeIncome.id, bridgeExpense.id, targetIncome.id];

            yield* expectSourcesParented(canonicalId, sourceIds);
            yield* expectMovedSources(canonicalId, sourceIds);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reclaims a generated direct transfer pair before generic bridge consolidation in a full scan', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, directTransfer, sourceAccount, targetAccount } = yield* seedBridgeReclaimFixture(
                TransactionConsolidationTypeEnum.TRANSFER_PAIR
            );

            yield* expectSingleConsolidation();

            yield* expectBridgeReclaimedIntoDirectTransfer(directTransfer.id, sourceAccount.id, targetAccount.id, [
                bridgeIncome.id,
                bridgeExpense.id
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reclaims late bridge legs into an existing direct transfer pair inside a scoped sync scan', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { bridgeExpense, bridgeIncome, directTransfer, sourceAccount, targetAccount } = yield* seedBridgeReclaimFixture(
                TransactionConsolidationTypeEnum.TRANSFER_PAIR
            );
            const scope = buildBridgeScope([bridgeIncome, bridgeExpense]);

            const result = yield* transferConsolidationService.consolidate(scope);

            expect(result.found).toBe(1);
            expect(result.consolidated).toBe(1);
            yield* expectBridgeReclaimedIntoDirectTransfer(directTransfer.id, sourceAccount.id, targetAccount.id, [
                bridgeIncome.id,
                bridgeExpense.id
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not reclaim late bridge legs into a source-less hand-created transfer', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { bridgeExpense, bridgeIncome, directTransfer } = yield* seedBridgeReclaimFixture(null);
            const scope = buildBridgeScope([bridgeIncome, bridgeExpense]);

            const result = yield* transferConsolidationService.consolidate(scope);

            expect(result.found).toBe(0);
            expect(result.consolidated).toBe(0);
            expect((yield* fetchTransactionById(directTransfer.id)).consolidationType).toBeNull();
            expect((yield* fetchTransactionById(bridgeIncome.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* fetchTransactionById(bridgeExpense.id)).consolidationParentTransactionId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps source and target rows separate when the existing bridge canonical has no original identity', () =>
        Effect.gen(function* () {
            const operatedAt = new Date(2026, 4, 21, 13, 50, 4);
            const { transferMcc, sourceAccount, targetAccount } = yield* seedBridgeAccounts();
            const canonicalTransfer = yield* seedDirectTransfer(
                operatedAt,
                sourceAccount.id,
                targetAccount.id,
                TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER
            );
            const sourceExpense = yield* seedBankPair.expense(
                { externalId: 'leftover-source-expense', operatedAt },
                {
                    accountId: sourceAccount.id,
                    amount: EUR_AMOUNT,
                    exchangeRate: UAH_TO_EUR_RATE,
                    mccCategoryId: transferMcc.id,
                    toIban: TARGET_IBAN
                }
            );
            const targetIncome = yield* seedTargetIncome(
                'leftover-target-income',
                new Date(operatedAt.getTime() + 1000),
                targetAccount.id,
                transferMcc.id
            );

            const accountBalanceRepository = yield* AccountBalanceRepository;
            const canonicalBefore = yield* fetchTransactionById(canonicalTransfer.id);
            const canonicalEntriesBefore = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.transactionId, canonicalTransfer.id));
            const expectedBalances = new Map([
                [sourceAccount.id, -2 * EUR_AMOUNT],
                [targetAccount.id, 2 * UAH_AMOUNT]
            ]);

            expect(yield* accountBalanceRepository.getLedgerBalances([sourceAccount.id, targetAccount.id])).toEqual(expectedBalances);
            yield* expectSingleConsolidation();

            const bridgeCanonicals = yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
            const pairCanonicals = yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            expect(bridgeCanonicals).toEqual([canonicalBefore]);
            expect(pairCanonicals).toHaveLength(1);
            expect(pairCanonicals[0].id).not.toBe(canonicalTransfer.id);
            expect(pairCanonicals[0].fromAccountId).toBe(sourceAccount.id);
            expect(pairCanonicals[0].toAccountId).toBe(targetAccount.id);
            expect(pairCanonicals[0].consolidationParentTransactionId).toBeNull();
            expect(pairCanonicals[0].deletedAt).toBeNull();
            expect(
                yield* testDb
                    .select()
                    .from(TransactionEntryEntityTable)
                    .where(eq(TransactionEntryEntityTable.transactionId, canonicalTransfer.id))
            ).toEqual(canonicalEntriesBefore);
            yield* expectSourcesParented(pairCanonicals[0].id, [sourceExpense.id, targetIncome.id]);
            yield* expectMovedSources(pairCanonicals[0].id, [sourceExpense.id, targetIncome.id]);
            yield* expectMovedSources(canonicalTransfer.id, []);
            expect(yield* accountBalanceRepository.getLedgerBalances([sourceAccount.id, targetAccount.id])).toEqual(expectedBalances);
            expect(yield* fetchCachedBalanceAmount(sourceAccount.id)).toBe(-2 * EUR_AMOUNT);
            expect(yield* fetchCachedBalanceAmount(targetAccount.id)).toBe(2 * UAH_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );
});
