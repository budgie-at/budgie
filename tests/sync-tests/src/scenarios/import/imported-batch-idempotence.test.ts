import { CategorySourceEnum, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { TransactionImportService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, TestLayer, testQueryService } from '../../harness';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const buildImportInput = (
    accountId: number,
    externalId: string,
    title: string,
    operatedAt = new Date(2026, 0, 15, 12, 0, 0)
): TransactionCreateInputInterface => ({
    amount: 10,
    title,
    comment: '',
    type: TransactionTypeEnum.EXPENSE,
    exchangeRate: 1,
    operatedAt,
    externalId,
    externalSource: ExternalSourceEnum.ERSTE,
    updatedBy: null,
    fromAccountId: accountId,
    toAccountId: null,
    tagIds: [],
    entries: [
        {
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: 10_000_000,
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            externalId,
            exchangeRate: 1,
            toIban: null
        }
    ]
});

describe('import/imported-batch-idempotence', () => {
    it.effect('collapses exact duplicate external IDs inside one import batch', () =>
        Effect.gen(function* () {
            const transactionImportService = yield* TransactionImportService;
            const account = yield* seed.account({ externalSource: ExternalSourceEnum.ERSTE });
            const input = buildImportInput(account.id, 'erste-duplicate-id', 'ERSTE exact duplicate');

            const importedTransactions = yield* Effect.map(
                transactionImportService.bulkUpsertPreparedImported(
                    transactionImportService.prepareImportedInputs([input, input], new Map())
                ),
                ({ transactions }) => transactions
            );

            expect(importedTransactions).toHaveLength(1);
            expect(importedTransactions[0].externalId).toBe('erste-duplicate-id');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps same-ID collisions by assigning deterministic suffixed external IDs', () =>
        Effect.gen(function* () {
            const transactionImportService = yield* TransactionImportService;
            const account = yield* seed.account({ externalSource: ExternalSourceEnum.ERSTE });
            const firstInput = buildImportInput(account.id, 'erste-collision-id', 'FITINN MDID:MREF11065472');
            const secondInput = buildImportInput(account.id, 'erste-collision-id', 'FITINN MDID:MREF11123384');

            const importedTransactions = yield* Effect.map(
                transactionImportService.bulkUpsertPreparedImported(
                    transactionImportService.prepareImportedInputs([firstInput, secondInput], new Map())
                ),
                ({ transactions }) => transactions
            );
            const firstTransaction = yield* testQueryService.findTransactionById(importedTransactions[0].id);
            const secondTransaction = yield* testQueryService.findTransactionById(importedTransactions[1].id);
            const existingTransactionIdMap = new Map([
                ['erste-collision-id', firstTransaction.id],
                ['erste-collision-id:2', secondTransaction.id]
            ]);
            const reimportedTransactions = yield* Effect.map(
                transactionImportService.bulkUpsertPreparedImported(
                    transactionImportService.prepareImportedInputs([firstInput, secondInput], existingTransactionIdMap)
                ),
                ({ transactions }) => transactions
            );

            expect(importedTransactions).toHaveLength(2);
            expect(firstTransaction.externalId).toBe('erste-collision-id');
            expect(secondTransaction.externalId).toBe('erste-collision-id:2');
            expect(reimportedTransactions.map(transaction => transaction.id)).toEqual([firstTransaction.id, secondTransaction.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('maps legacy aliases after assigning deterministic collision suffixes', () =>
        Effect.gen(function* () {
            const transactionImportService = yield* TransactionImportService;
            const account = yield* seed.account({ externalSource: ExternalSourceEnum.ERSTE });
            const legacyFirstInput = buildImportInput(account.id, 'erste-legacy-id-1', 'FITINN MDID:MREF11065472');
            const legacySecondInput = buildImportInput(account.id, 'erste-legacy-id-2', 'FITINN MDID:MREF11123384');
            const [legacyFirstTransaction, legacySecondTransaction] = yield* Effect.map(
                transactionImportService.bulkUpsertPreparedImported(
                    transactionImportService.prepareImportedInputs([legacyFirstInput, legacySecondInput], new Map())
                ),
                ({ transactions }) => transactions
            );
            const existingTransactionIdMap = new Map([
                ['erste-legacy-id-1', legacyFirstTransaction.id],
                ['erste-legacy-id-2', legacySecondTransaction.id]
            ]);
            const firstInput = {
                ...buildImportInput(account.id, 'erste-collision-alias-id', 'FITINN MDID:MREF11065472'),
                externalIdAliases: ['erste-legacy-id-1']
            };
            const secondInput = {
                ...buildImportInput(account.id, 'erste-collision-alias-id', 'FITINN MDID:MREF11123384'),
                externalIdAliases: ['erste-legacy-id-2']
            };

            const importedTransactions = yield* Effect.map(
                transactionImportService.bulkUpsertPreparedImported(
                    transactionImportService.prepareImportedInputs([firstInput, secondInput], existingTransactionIdMap)
                ),
                ({ transactions }) => transactions
            );
            const firstTransaction = yield* testQueryService.findTransactionById(importedTransactions[0].id);
            const secondTransaction = yield* testQueryService.findTransactionById(importedTransactions[1].id);

            expect(importedTransactions.map(transaction => transaction.id)).toEqual([
                legacyFirstTransaction.id,
                legacySecondTransaction.id
            ]);
            expect(firstTransaction.externalId).toBe('erste-collision-alias-id');
            expect(secondTransaction.externalId).toBe('erste-collision-alias-id:2');
        }).pipe(Effect.provide(TestLayer))
    );
});
