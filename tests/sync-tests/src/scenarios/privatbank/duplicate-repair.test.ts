import { PRIVATBANK_DUPLICATE_CANDIDATE_SQL } from '@app/sync/constant/privatbank-duplicate-candidate-sql.constant';
import { SyncRepairService } from '@app/sync/service/sync-repair.service';
import {
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { describe, expect, it, vi } from '@effect/vitest';
import { sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type { SyncDuplicateCandidateRowInterface } from '@app/sync/interface/sync-duplicate-candidate-row.interface';
import type {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

const PRIVATBANK_DUPLICATE_TITLE = "Зарплата, СУПЕРМАШ. Коментар: Zarobitna plata-Za kviten' 2026";
const PRIVATBANK_DUPLICATE_AMOUNT = 1_780_860_000;
const PRIVATBANK_DUPLICATE_OPERATED_AT = new Date('2026-05-07T08:46:37.000Z');

const fetchPrivatbankDuplicateCandidates = () =>
    Effect.gen(function* () {
        return yield* testDb.all<SyncDuplicateCandidateRowInterface>(sql.raw(PRIVATBANK_DUPLICATE_CANDIDATE_SQL));
    });

const expectTransferPairDuplicate = (keptTransaction: TransactionEntityInterface, duplicateTransaction: TransactionEntityInterface) =>
    Effect.gen(function* () {
        const candidates = yield* fetchPrivatbankDuplicateCandidates();

        expect(candidates).toEqual([
            expect.objectContaining({
                duplicateTransactionId: duplicateTransaction.id,
                keptTransactionId: keptTransaction.id,
                reason: 'transfer_pair_duplicate'
            })
        ]);
    });

const seedPrivatbankIncome = ({
    accountId,
    externalId,
    consolidationParentTransactionId
}: {
    readonly accountId: number;
    readonly externalId: string;
    readonly consolidationParentTransactionId?: number | null;
}) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.INCOME,
            title: PRIVATBANK_DUPLICATE_TITLE,
            externalId,
            externalSource: ExternalSourceEnum.PRIVATBANK,
            operatedAt: PRIVATBANK_DUPLICATE_OPERATED_AT,
            exchangeRate: 1,
            fromAccountId: null,
            toAccountId: accountId,
            comment: '',
            updatedBy: null,
            consolidationParentTransactionId: consolidationParentTransactionId ?? null,
            consolidationType: null
        } satisfies TransactionCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId,
            type: TransactionEntryTypeEnum.DEBIT,
            amount: PRIVATBANK_DUPLICATE_AMOUNT,
            externalId,
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        return transaction;
    });

const seedCanonicalTransfer = (accountId: number) =>
    Effect.gen(function* () {
        return yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.TRANSFER,
            title: 'Canonical transfer',
            externalId: null,
            externalSource: null,
            operatedAt: PRIVATBANK_DUPLICATE_OPERATED_AT,
            exchangeRate: 1,
            fromAccountId: accountId,
            toAccountId: accountId,
            comment: '',
            updatedBy: null,
            consolidationParentTransactionId: null,
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR
        } satisfies TransactionCreateEntityInterface);
    });

const seedMovedEntry = (canonicalTransactionId: number, sourceTransactionId: number, accountId: number, externalId: string) =>
    Effect.gen(function* () {
        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: canonicalTransactionId,
            accountId,
            type: TransactionEntryTypeEnum.DEBIT,
            amount: PRIVATBANK_DUPLICATE_AMOUNT,
            externalId,
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: sourceTransactionId
        } satisfies TransactionEntryCreateEntityInterface);
    });

const seedPrivatbankDebtPayment = (accountId: number, debtAccountId: number) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.DEBT,
            title: 'Єгоров І.',
            externalId: 'privatbank-debt-kept',
            externalSource: ExternalSourceEnum.PRIVATBANK,
            operatedAt: new Date('2026-05-06T12:52:02.000Z'),
            exchangeRate: 1,
            fromAccountId: accountId,
            toAccountId: debtAccountId,
            comment: '',
            updatedBy: null,
            consolidationParentTransactionId: null,
            consolidationType: null
        } satisfies TransactionCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: 28_000_000_000,
            externalId: 'privatbank-debt-kept',
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId: debtAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            amount: 660_533_145,
            externalId: null,
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        return transaction;
    });

const seedPrivatbankExpense = (accountId: number, mccCategoryId: number | null = null) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.EXPENSE,
            title: 'Єгоров І.',
            externalId: 'privatbank-debt-duplicate',
            externalSource: ExternalSourceEnum.PRIVATBANK,
            operatedAt: new Date('2026-05-06T12:52:02.000Z'),
            exchangeRate: 1,
            fromAccountId: accountId,
            toAccountId: null,
            comment: '',
            updatedBy: null,
            consolidationParentTransactionId: null,
            consolidationType: null
        } satisfies TransactionCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: 28_000_000_000,
            externalId: 'privatbank-debt-duplicate',
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        return transaction;
    });

const seedPrivatbankTransferWithMatchingExpenseLeg = (accountId: number, targetAccountId: number) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.TRANSFER,
            title: 'Єгоров І.',
            externalId: 'privatbank-transfer-same-leg',
            externalSource: ExternalSourceEnum.PRIVATBANK,
            operatedAt: new Date('2026-05-06T12:52:02.000Z'),
            exchangeRate: 1,
            fromAccountId: accountId,
            toAccountId: targetAccountId,
            comment: '',
            updatedBy: null,
            consolidationParentTransactionId: null,
            consolidationType: null
        } satisfies TransactionCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: 28_000_000_000,
            externalId: 'privatbank-transfer-same-leg-credit',
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId: targetAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            amount: 28_000_000_000,
            externalId: 'privatbank-transfer-same-leg-debit',
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        return transaction;
    });

const seedPrivatbankTransferSource = ({
    accountId,
    amount,
    canonicalTransactionId,
    entryType,
    externalId,
    operatedAt,
    title,
    type
}: {
    readonly accountId: number;
    readonly amount: number;
    readonly canonicalTransactionId: number;
    readonly entryType: TransactionEntryTypeEnum;
    readonly externalId: string;
    readonly operatedAt: Date;
    readonly title: string;
    readonly type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
}) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type,
            title,
            externalId,
            externalSource: ExternalSourceEnum.PRIVATBANK,
            operatedAt,
            exchangeRate: 1,
            fromAccountId: entryType === TransactionEntryTypeEnum.CREDIT ? accountId : null,
            toAccountId: entryType === TransactionEntryTypeEnum.DEBIT ? accountId : null,
            comment: '',
            updatedBy: null,
            consolidationParentTransactionId: canonicalTransactionId,
            consolidationType: null
        } satisfies TransactionCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: canonicalTransactionId,
            accountId,
            type: entryType,
            amount,
            externalId,
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: transaction.id
        } satisfies TransactionEntryCreateEntityInterface);

        return transaction;
    });

const seedPrivatbankCanonicalTransferPair = ({
    amount,
    consolidationType = TransactionConsolidationTypeEnum.TRANSFER_PAIR,
    creditAmount = amount,
    debitAmount = amount,
    fromAccountId,
    operatedAt,
    sourceExternalIdPrefix,
    title,
    toAccountId
}: {
    readonly amount: number;
    readonly consolidationType?: TransactionConsolidationTypeEnum;
    readonly creditAmount?: number;
    readonly debitAmount?: number;
    readonly fromAccountId: number;
    readonly operatedAt: Date;
    readonly sourceExternalIdPrefix: string;
    readonly title: string;
    readonly toAccountId: number;
}) =>
    Effect.gen(function* () {
        const transaction = yield* insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.TRANSFER,
            title,
            externalId: null,
            externalSource: null,
            operatedAt,
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            comment: '',
            updatedBy: null,
            consolidationParentTransactionId: null,
            consolidationType
        } satisfies TransactionCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId: fromAccountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: creditAmount,
            externalId: null,
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        yield* insertOne(TransactionEntryEntityTable, {
            transactionId: transaction.id,
            accountId: toAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            amount: debitAmount,
            externalId: null,
            exchangeRate: 1,
            categoryId: null,
            mccCategoryId: null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        yield* seedPrivatbankTransferSource({
            accountId: fromAccountId,
            amount: creditAmount,
            canonicalTransactionId: transaction.id,
            entryType: TransactionEntryTypeEnum.CREDIT,
            externalId: `${sourceExternalIdPrefix}-expense`,
            operatedAt,
            title,
            type: TransactionTypeEnum.EXPENSE
        });

        yield* seedPrivatbankTransferSource({
            accountId: toAccountId,
            amount: debitAmount,
            canonicalTransactionId: transaction.id,
            entryType: TransactionEntryTypeEnum.DEBIT,
            externalId: `${sourceExternalIdPrefix}-income`,
            operatedAt,
            title,
            type: TransactionTypeEnum.INCOME
        });

        return transaction;
    });

const expectVisibleDuplicate = (duplicateTransactionId: number, keptTransactionId: number) =>
    Effect.gen(function* () {
        expect(yield* fetchPrivatbankDuplicateCandidates()).toEqual([
            expect.objectContaining({ duplicateTransactionId, keptTransactionId, reason: 'visible_duplicate' })
        ]);
    });

describe('privatbank/duplicate-repair', () => {
    it.effect('detects visible duplicates imported with the exact same operated timestamp', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
            const keptTransaction = yield* seedPrivatbankIncome({ accountId: account.id, externalId: 'privatbank-income-kept' });
            const duplicateTransaction = yield* seedPrivatbankIncome({ accountId: account.id, externalId: 'privatbank-income-duplicate' });

            yield* expectVisibleDuplicate(duplicateTransaction.id, keptTransaction.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('detects exact duplicates when the kept source transaction has already been consolidated', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
            const canonicalTransaction = yield* seedCanonicalTransfer(account.id);
            const keptTransaction = yield* seedPrivatbankIncome({
                accountId: account.id,
                externalId: 'privatbank-consolidated-kept',
                consolidationParentTransactionId: canonicalTransaction.id
            });
            const duplicateTransaction = yield* seedPrivatbankIncome({
                accountId: account.id,
                externalId: 'privatbank-consolidated-duplicate'
            });

            yield* seedMovedEntry(canonicalTransaction.id, keptTransaction.id, account.id, 'privatbank-consolidated-kept');

            const candidates = yield* fetchPrivatbankDuplicateCandidates();

            expect(candidates).toEqual([
                expect.objectContaining({
                    duplicateTransactionId: duplicateTransaction.id,
                    keptTransactionId: keptTransaction.id,
                    reason: 'hidden_source_duplicate'
                })
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rebuilds balances after duplicate soft deletes leave the write transaction', () =>
        Effect.gen(function* () {
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const syncRepairService = yield* SyncRepairService;
            const account = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });

            yield* seedPrivatbankIncome({ accountId: account.id, externalId: 'privatbank-income-kept' });
            yield* seedPrivatbankIncome({ accountId: account.id, externalId: 'privatbank-income-duplicate' });

            const updateAllBalancesSpy = vi.spyOn(accountBalanceIncrementalService, 'updateAllBalances').mockReturnValue(Effect.void);
            yield* Effect.addFinalizer(() => Effect.sync(() => updateAllBalancesSpy.mockRestore()));

            const result = yield* syncRepairService.removeDuplicates();

            expect(result.repairedTransactionCount).toBe(1);
            expect(updateAllBalancesSpy).toHaveBeenCalledTimes(1);
            expect(updateAllBalancesSpy).toHaveBeenCalledWith(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('detects a duplicate when the kept transaction was converted to a debt payment', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
            const debtAccount = yield* seed.account({ title: 'Віладжіо' });
            const expenseMccCategory = yield* seed.mccCategory({ mcc: '0779' });
            const keptTransaction = yield* seedPrivatbankDebtPayment(account.id, debtAccount.id);
            const duplicateTransaction = yield* seedPrivatbankExpense(account.id, expenseMccCategory.id);

            yield* expectVisibleDuplicate(duplicateTransaction.id, keptTransaction.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores cross-type rows outside the debt-payment conversion case', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
            const targetAccount = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-0356' });

            yield* seedPrivatbankExpense(account.id);
            yield* seedPrivatbankTransferWithMatchingExpenseLeg(account.id, targetAccount.id);

            const candidates = yield* fetchPrivatbankDuplicateCandidates();

            expect(candidates).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('detects duplicate PrivatBank transfer-pair canonicals with a one-hour shifted timestamp', () =>
        Effect.gen(function* () {
            const fromAccount = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
            const toAccount = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-0356' });
            const keptTransaction = yield* seedPrivatbankCanonicalTransferPair({
                amount: 10_000_000_000,
                fromAccountId: fromAccount.id,
                operatedAt: new Date('2026-01-24T10:44:38.000Z'),
                sourceExternalIdPrefix: 'privatbank-transfer-kept',
                title: 'На свою картку *0356',
                toAccountId: toAccount.id
            });
            const duplicateTransaction = yield* seedPrivatbankCanonicalTransferPair({
                amount: 10_000_000_000,
                fromAccountId: fromAccount.id,
                operatedAt: new Date('2026-01-24T11:44:38.000Z'),
                sourceExternalIdPrefix: 'privatbank-transfer-duplicate',
                title: 'На свою картку *0356',
                toAccountId: toAccount.id
            });

            yield* expectTransferPairDuplicate(keptTransaction, duplicateTransaction);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('detects duplicate PrivatBank same-bank fee transfer canonicals', () =>
        Effect.gen(function* () {
            const fromAccount = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-0356' });
            const toAccount = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-5524' });
            const keptTransaction = yield* seedPrivatbankCanonicalTransferPair({
                amount: 10_000_000_000,
                consolidationType: TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER,
                creditAmount: 10_300_000_000,
                fromAccountId: fromAccount.id,
                operatedAt: new Date('2026-05-14T09:30:38.000Z'),
                sourceExternalIdPrefix: 'privatbank-fee-transfer-kept',
                title: 'На свою картку *5524',
                toAccountId: toAccount.id
            });
            const duplicateTransaction = yield* seedPrivatbankCanonicalTransferPair({
                amount: 10_000_000_000,
                consolidationType: TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER,
                creditAmount: 10_300_000_000,
                fromAccountId: fromAccount.id,
                operatedAt: new Date('2026-05-14T09:30:38.000Z'),
                sourceExternalIdPrefix: 'privatbank-fee-transfer-duplicate',
                title: 'На свою картку *5524',
                toAccountId: toAccount.id
            });

            yield* expectTransferPairDuplicate(keptTransaction, duplicateTransaction);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('soft-deletes the consolidation children of a removed duplicate transfer-pair canonical', () =>
        Effect.gen(function* () {
            const syncRepairService = yield* SyncRepairService;
            const fromAccount = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-8522' });
            const toAccount = yield* seed.account({ externalSource: ExternalSourceEnum.PRIVATBANK, externalId: 'privatbank-0356' });
            const transferPair = {
                amount: 10_000_000_000,
                fromAccountId: fromAccount.id,
                title: 'На свою картку *0356',
                toAccountId: toAccount.id
            };
            yield* seedPrivatbankCanonicalTransferPair({
                ...transferPair,
                operatedAt: new Date('2026-01-24T10:44:38.000Z'),
                sourceExternalIdPrefix: 'privatbank-transfer-kept'
            });
            yield* seedPrivatbankCanonicalTransferPair({
                ...transferPair,
                operatedAt: new Date('2026-01-24T11:44:38.000Z'),
                sourceExternalIdPrefix: 'privatbank-transfer-duplicate'
            });

            yield* syncRepairService.removeDuplicates();

            expect(
                yield* testDb.all(
                    sql`SELECT child.id FROM transactions child INNER JOIN transactions parent ON parent.id = child.consolidation_parent_transaction_id WHERE child.deleted_at IS NULL AND parent.deleted_at IS NOT NULL`
                )
            ).toEqual([]);
            expect(yield* testDb.all(sql`SELECT id FROM transactions WHERE deleted_at IS NULL`)).toHaveLength(3);
        }).pipe(Effect.provide(TestLayer))
    );
});
