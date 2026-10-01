import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import {
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    CategoryEntityTable,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    StatisticsRepository,
    TransactionCategorizeInboxRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionViewRepository,
    UserIconNameEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { seed } from '../../harness/seed/seed';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface EntrySeedInterface {
    readonly accountId: number;
    readonly type: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly categoryId: number | null;
}

interface ScopeInterface {
    readonly name: string;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly accountIds: number[] | null;
    readonly date: { readonly from: Date; readonly to: Date } | null;
    readonly uncategorized: number;
    readonly untagged: number;
}

const JANUARY = { from: new Date('2026-01-01T00:00:00Z'), to: new Date('2026-01-31T23:59:59Z') };
const FEBRUARY_OPERATED_AT = new Date('2026-02-10T12:00:00Z');
const JANUARY_OPERATED_AT = new Date('2026-01-10T12:00:00Z');

let amountSequence = 0;

const nextAmount = (): number => {
    amountSequence += 1;

    return (100 + amountSequence * 7) * PRECISION;
};

const seedTransaction = (
    type: TransactionTypeEnum,
    operatedAt: Date,
    entries: readonly EntrySeedInterface[],
    tagId: number | null = null
) =>
    Effect.gen(function* () {
        const [firstEntry] = entries;
        const transaction = yield* insertOne(TransactionEntityTable, {
            type,
            title: `Parity ${type} ${entries.length}`,
            operatedAt,
            comment: '',
            fromAccountId: type === TransactionTypeEnum.INCOME ? null : firstEntry.accountId,
            toAccountId: type === TransactionTypeEnum.INCOME ? firstEntry.accountId : null,
            exchangeRate: 1,
            externalId: null,
            externalSource: ExternalSourceEnum.CSV,
            updatedBy: null
        });

        for (const entry of entries) {
            yield* insertOne(TransactionEntryEntityTable, {
                transactionId: transaction.id,
                accountId: entry.accountId,
                type: entry.type,
                amount: entry.amount,
                categoryId: entry.categoryId,
                mccCategoryId: null,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: 1,
                baseExchangeRate: 1,
                baseAmount: entry.amount,
                toIban: null,
                originalTransactionId: null
            });
        }

        if (isDefined(tagId)) {
            yield* seed.transactionTag(transaction.id, tagId);
        }

        return transaction.id;
    });

const seedParityLedger = Effect.gen(function* () {
    const transferConsolidationService = yield* TransferConsolidationService;
    const card = yield* seed.account({ title: 'Card', externalId: 'parity-card' });
    const savings = yield* seed.account({ title: 'Savings', externalId: 'parity-savings' });
    const debt = yield* seed.account({ title: 'Friend', type: AccountTypeEnum.DEBT });
    const category = yield* insertOne(CategoryEntityTable, {
        title: 'Parity',
        titleSearch: 'parity',
        icon: UserIconNameEnum.Wallet,
        parentId: null
    });
    const tag = yield* seed.tag('Parity');
    const credit = (accountId: number, categoryId: number | null): EntrySeedInterface => ({
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: nextAmount(),
        categoryId
    });
    const fee = (accountId: number, categoryId: number | null): EntrySeedInterface => ({
        accountId,
        type: TransactionEntryTypeEnum.FEE,
        amount: PRECISION,
        categoryId
    });

    yield* seedTransaction(TransactionTypeEnum.EXPENSE, JANUARY_OPERATED_AT, [credit(card.id, null)]);
    yield* seedTransaction(
        TransactionTypeEnum.EXPENSE,
        JANUARY_OPERATED_AT,
        [credit(card.id, null), fee(card.id, BANK_FEE_CATEGORY_ID)],
        tag.id
    );
    yield* seedTransaction(TransactionTypeEnum.EXPENSE, FEBRUARY_OPERATED_AT, [credit(savings.id, category.id), fee(savings.id, null)]);
    yield* seedTransaction(TransactionTypeEnum.EXPENSE, JANUARY_OPERATED_AT, [credit(debt.id, null)]);
    yield* seedTransaction(TransactionTypeEnum.EXPENSE, FEBRUARY_OPERATED_AT, [credit(card.id, category.id), credit(savings.id, null)]);
    yield* seedTransaction(TransactionTypeEnum.EXPENSE, FEBRUARY_OPERATED_AT, [credit(card.id, category.id)], tag.id);
    yield* seedTransaction(TransactionTypeEnum.INCOME, JANUARY_OPERATED_AT, [
        { accountId: savings.id, type: TransactionEntryTypeEnum.DEBIT, amount: nextAmount(), categoryId: null }
    ]);

    const transfer = yield* seed.directTransfer({
        exchangeRate: 1,
        operatedAt: JANUARY_OPERATED_AT,
        sourceAccountId: card.id,
        sourceAmount: nextAmount(),
        sourceEntryExchangeRate: 1,
        targetAccountId: savings.id,
        targetAmount: nextAmount(),
        toIban: null
    });
    yield* seed.feeEntry(transfer.id, null, { accountId: card.id, amount: PRECISION });
    yield* seed.refundedExpense({ accountId: card.id, expenseAmount: nextAmount(), refundAmounts: [PRECISION * 3] });
    yield* transferConsolidationService.consolidate(null);

    return { card, savings };
});

const buildFilters = (scope: ScopeInterface): TransactionFilterInterface => ({
    ...DEFAULT_TRANSACTION_FILTER,
    types: [scope.type],
    accountIds: scope.accountIds,
    date: scope.date
});

const countDistinctTransactions = (rows: readonly { readonly transactionId: number }[]): number =>
    new Set(rows.map(row => row.transactionId)).size;

const countStatisticsTransactions = Effect.fnUntraced(function* (
    scope: ScopeInterface,
    categoryIds: number[] | null,
    tagIds: number[] | null
) {
    const statisticsRepository = yield* StatisticsRepository;
    const transactions = yield* statisticsRepository.getTransactions(
        {
            type: scope.type,
            date: scope.date,
            categoryIds,
            excludedCategoryIds: null,
            tagIds,
            accountIds: scope.accountIds,
            amount: null
        },
        1000,
        LanguageEnum.EN
    );

    return transactions.length;
});

describe('pill, inbox and statistics parity', () => {
    const arrangeScopes = Effect.gen(function* () {
        amountSequence = 0;
        const { card, savings } = yield* seedParityLedger;

        return [
            { name: 'all time expense', type: TransactionTypeEnum.EXPENSE, accountIds: null, date: null, uncategorized: 4, untagged: 4 },
            { name: 'all time income', type: TransactionTypeEnum.INCOME, accountIds: null, date: null, uncategorized: 1, untagged: 1 },
            { name: 'january expense', type: TransactionTypeEnum.EXPENSE, accountIds: null, date: JANUARY, uncategorized: 3, untagged: 2 },
            { name: 'card expense', type: TransactionTypeEnum.EXPENSE, accountIds: [card.id], date: null, uncategorized: 4, untagged: 3 },
            {
                name: 'savings expense',
                type: TransactionTypeEnum.EXPENSE,
                accountIds: [savings.id],
                date: null,
                uncategorized: 1,
                untagged: 2
            }
        ] satisfies ScopeInterface[];
    });

    it.effect('counts the same uncategorized transactions in the pill, the inbox and the statistics bucket', () =>
        Effect.gen(function* () {
            const scopes = yield* arrangeScopes;
            const transactionViewRepository = yield* TransactionViewRepository;
            const transactionCategorizeInboxRepository = yield* TransactionCategorizeInboxRepository;
            for (const scope of scopes) {
                const filters = buildFilters(scope);
                const [pill] = yield* transactionViewRepository.countUncategorized(filters);
                const inboxRows = yield* transactionCategorizeInboxRepository.findUncategorizedRows(filters);
                const statisticsCount = yield* countStatisticsTransactions(scope, [], null);

                expect({
                    scope: scope.name,
                    pill: pill.income + pill.expense,
                    inbox: countDistinctTransactions(inboxRows),
                    statistics: statisticsCount
                }).toEqual({
                    scope: scope.name,
                    pill: scope.uncategorized,
                    inbox: scope.uncategorized,
                    statistics: scope.uncategorized
                });
            }
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('counts the same untagged transactions in the tag inbox and the statistics bucket', () =>
        Effect.gen(function* () {
            const scopes = yield* arrangeScopes;
            const transactionCategorizeInboxRepository = yield* TransactionCategorizeInboxRepository;
            for (const scope of scopes) {
                const inboxRows = yield* transactionCategorizeInboxRepository.findUntaggedRows(buildFilters(scope));
                const statisticsCount = yield* countStatisticsTransactions(scope, null, []);

                expect({ scope: scope.name, inbox: countDistinctTransactions(inboxRows), statistics: statisticsCount }).toEqual({
                    scope: scope.name,
                    inbox: scope.untagged,
                    statistics: scope.untagged
                });
            }
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('never treats transfers with uncategorized legs as uncategorized', () =>
        Effect.gen(function* () {
            yield* arrangeScopes;
            const transactionViewRepository = yield* TransactionViewRepository;
            const transactionCategorizeInboxRepository = yield* TransactionCategorizeInboxRepository;
            const statisticsRepository = yield* StatisticsRepository;
            const transferFilters = { ...DEFAULT_TRANSACTION_FILTER, types: [TransactionTypeEnum.TRANSFER] };
            const uncategorizedListFilters = { ...DEFAULT_TRANSACTION_FILTER, categoryIds: [] };
            const [transferPill] = yield* transactionViewRepository.countUncategorized(transferFilters);
            const transferInboxRows = yield* transactionCategorizeInboxRepository.findUncategorizedRows(transferFilters);
            const [transferListCount] = yield* transactionViewRepository.countAll({ ...transferFilters, categoryIds: [] });
            const [pill] = yield* transactionViewRepository.countUncategorized(DEFAULT_TRANSACTION_FILTER);
            const uncategorizedList = yield* transactionViewRepository.getAll(1000, uncategorizedListFilters, LanguageEnum.EN);
            const statisticsTransactions = yield* statisticsRepository.getTransactions(
                { ...uncategorizedListFilters, type: null, excludedCategoryIds: null },
                1000,
                LanguageEnum.EN
            );
            const transferTypes = [...uncategorizedList, ...statisticsTransactions].filter(
                transaction => transaction.type === TransactionTypeEnum.TRANSFER
            );

            expect({
                transferPill: transferPill.income + transferPill.expense,
                transferInbox: transferInboxRows.length,
                transferList: transferListCount.value,
                transferTypes,
                listCount: uncategorizedList.length,
                statisticsCount: statisticsTransactions.length
            }).toEqual({
                transferPill: 0,
                transferInbox: 0,
                transferList: 0,
                transferTypes: [],
                listCount: pill.income + pill.expense,
                statisticsCount: pill.income + pill.expense
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
