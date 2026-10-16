import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    AccountBalanceRepository,
    AccountTypeEnum,
    CategoryRepository,
    CategorySourceEnum,
    Db,
    ExternalSourceEnum,
    PRECISION,
    TagSourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTagsRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

import { CategoryService } from '../src/category/service/category.service';
import { TransactionImportService } from '../src/transaction/service/transaction-import.service';
import { TransactionService } from '../src/transaction/service/transaction.service';
import { TransferCreationService } from '../src/transaction/service/transfer-creation.service';

import { seed, TestLayer } from './ledger-test-layer';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

const operatedAt = new Date(2026, 0, 15, 12, 0, 0);

const buildInput = (
    type: TransactionTypeEnum,
    entries: TransactionCreateInputInterface['entries'],
    externalId: string | null = null
): TransactionCreateInputInterface => ({
    type,
    title: 'Ledger test',
    amount: entries[0].amount,
    operatedAt,
    comment: '',
    fromAccountId: entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT)?.accountId ?? null,
    toAccountId: entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT)?.accountId ?? null,
    exchangeRate: 1,
    externalId,
    externalSource: externalId === null ? null : ExternalSourceEnum.ERSTE,
    updatedBy: null,
    tagIds: [],
    entries
});

const buildEntry = (accountId: number, type: TransactionEntryTypeEnum, amount: number, externalId: string | null = null) => ({
    accountId,
    type,
    kind: TransactionEntryKindEnum.PRIMARY,
    amount,
    categoryId: null,
    categorySource: CategorySourceEnum.USER,
    mccCategoryId: null,
    externalId
});

const getTagSources = Effect.fn(function* (transactionId: number) {
    const transactionTagsRepository = yield* TransactionTagsRepository;
    const transactionTags = yield* transactionTagsRepository.findByTransactionId(transactionId);

    return transactionTags.map(({ tagId, source }) => ({ tagId, source })).sort((left, right) => left.tagId - right.tagId);
});

const categoryServiceFailingOnDelete = Layer.effect(CategoryService, CategoryService.make).pipe(
    Layer.provide(
        Layer.effect(
            CategoryRepository,
            Effect.map(CategoryRepository.make, categoryRepository => ({
                ...categoryRepository,
                deleteById: () => Effect.die(new Error('category delete failed'))
            }))
        )
    )
);

const getStoredBalance = Effect.fn(function* (accountId: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const balances = yield* accountBalanceRepository.getByAccountIds([accountId]);

    return balances.at(0)?.amount;
});

describe('ledger', () => {
    it.effect('creating an expense updates the account balance', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const testSeedService = yield* seed;
            const account = yield* testSeedService.account({ type: AccountTypeEnum.CASH });

            yield* transactionService.bulkCreate([
                buildInput(TransactionTypeEnum.EXPENSE, [buildEntry(account.id, TransactionEntryTypeEnum.CREDIT, 25)])
            ]);

            expect(yield* getStoredBalance(account.id)).toBe(-25 * PRECISION);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('a transfer between accounts keeps stored balances equal to the ledger', () =>
        Effect.gen(function* () {
            const transferCreationService = yield* TransferCreationService;
            const testSeedService = yield* seed;
            const fromAccount = yield* testSeedService.account({ type: AccountTypeEnum.CASH, title: 'From' });
            const toAccount = yield* testSeedService.account({ type: AccountTypeEnum.CASH, title: 'To' });

            yield* transferCreationService.createInternalTransfer(
                buildInput(TransactionTypeEnum.TRANSFER, [
                    buildEntry(fromAccount.id, TransactionEntryTypeEnum.CREDIT, 40),
                    buildEntry(toAccount.id, TransactionEntryTypeEnum.DEBIT, 40)
                ])
            );

            expect(yield* getStoredBalance(fromAccount.id)).toBe(-40 * PRECISION);
            expect(yield* getStoredBalance(toAccount.id)).toBe(40 * PRECISION);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-importing entries with the same external id is idempotent', () =>
        Effect.gen(function* () {
            const transactionImportService = yield* TransactionImportService;
            const testSeedService = yield* seed;
            const account = yield* testSeedService.account({ type: AccountTypeEnum.CASH });
            const input = buildInput(
                TransactionTypeEnum.EXPENSE,
                [buildEntry(account.id, TransactionEntryTypeEnum.CREDIT, 10, 'erste-1')],
                'erste-1'
            );

            const [imported] = yield* Effect.map(
                transactionImportService.bulkUpsertPreparedImported(transactionImportService.prepareImportedInputs([input], new Map())),
                ({ transactions }) => transactions
            );
            const reimported = yield* Effect.map(
                transactionImportService.bulkUpsertPreparedImported(
                    transactionImportService.prepareImportedInputs([input], new Map([['erste-1', imported.id]]))
                ),
                ({ transactions }) => transactions
            );

            expect(reimported.map(({ id }) => id)).toStrictEqual([imported.id]);
            expect(yield* getStoredBalance(account.id)).toBe(-10 * PRECISION);
            yield* assertStoredBalancesMatchLedger(yield* Db);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps tag sources on an edit with the same tag set and confirms every tag as USER once the set changes', () =>
        Effect.gen(function* () {
            const transactionService = yield* TransactionService;
            const testSeedService = yield* seed;
            const account = yield* testSeedService.account({ type: AccountTypeEnum.CASH });
            const userTag = yield* testSeedService.tag('Ledger user tag');
            const ruleTag = yield* testSeedService.tag('Ledger rule tag');
            const addedTag = yield* testSeedService.tag('Ledger added tag');
            const entries = [buildEntry(account.id, TransactionEntryTypeEnum.CREDIT, 5)];

            const [transaction] = yield* transactionService.bulkCreate([
                { ...buildInput(TransactionTypeEnum.EXPENSE, entries), tagIds: [userTag.id], ruleTagIds: [ruleTag.id] }
            ]);
            const createdSources = yield* getTagSources(transaction.id);

            yield* transactionService.updateById(transaction.id, { entries, tagIds: [ruleTag.id, userTag.id] });
            const unchangedSetSources = yield* getTagSources(transaction.id);

            yield* transactionService.updateById(transaction.id, { entries, tagIds: [ruleTag.id, addedTag.id] });
            const changedSetSources = yield* getTagSources(transaction.id);

            expect(createdSources).toStrictEqual([
                { tagId: userTag.id, source: TagSourceEnum.USER },
                { tagId: ruleTag.id, source: TagSourceEnum.RULE }
            ]);
            expect(unchangedSetSources).toStrictEqual(createdSources);
            expect(changedSetSources).toStrictEqual([
                { tagId: ruleTag.id, source: TagSourceEnum.USER },
                { tagId: addedTag.id, source: TagSourceEnum.USER }
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rolls back the entry reassignment when merging a category fails to delete the source', () =>
        Effect.gen(function* () {
            const testSeedService = yield* seed;
            const account = yield* testSeedService.account({ type: AccountTypeEnum.CASH });
            const sourceCategory = yield* testSeedService.category('Source');
            const targetCategory = yield* testSeedService.category('Target');
            yield* testSeedService.manualExpense({
                accountId: account.id,
                amount: 5 * PRECISION,
                operatedAt,
                categoryId: sourceCategory.id
            });

            const exit = yield* Effect.exit(
                Effect.flatMap(CategoryService, categoryService => categoryService.mergeInto(sourceCategory.id, targetCategory.id)).pipe(
                    Effect.provide(categoryServiceFailingOnDelete)
                )
            );
            const categoryRepository = yield* CategoryRepository;

            expect(Exit.isFailure(exit)).toBe(true);
            expect(yield* categoryRepository.countTransactionEntries(sourceCategory.id)).toBe(1);
            expect(yield* categoryRepository.countTransactionEntries(targetCategory.id)).toBe(0);
        }).pipe(Effect.provide(Layer.merge(TestLayer, CategoryRepository.layer)))
    );
});
