import { statisticsRepository, transactionCategorizeInboxRepository, transactionRepository } from '@app/@generic/drizzle/db/db';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import {
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    CategoryEntityTable,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { run } from '../../harness';
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
): number => {
    const [firstEntry] = entries;
    const transaction = insertOne(TransactionEntityTable, {
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
        insertOne(TransactionEntryEntityTable, {
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
        seed.transactionTag(transaction.id, tagId);
    }

    return transaction.id;
};

const seedParityLedger = async () => {
    const card = seed.account({ title: 'Card', externalId: 'parity-card' });
    const savings = seed.account({ title: 'Savings', externalId: 'parity-savings' });
    const debt = seed.account({ title: 'Friend', type: AccountTypeEnum.DEBT });
    const category = insertOne(CategoryEntityTable, {
        title: 'Parity',
        titleSearch: 'parity',
        icon: UserIconNameEnum.Wallet,
        parentId: null
    });
    const tag = seed.tag('Parity');
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

    seedTransaction(TransactionTypeEnum.EXPENSE, JANUARY_OPERATED_AT, [credit(card.id, null)]);
    seedTransaction(TransactionTypeEnum.EXPENSE, JANUARY_OPERATED_AT, [credit(card.id, null), fee(card.id, BANK_FEE_CATEGORY_ID)], tag.id);
    seedTransaction(TransactionTypeEnum.EXPENSE, FEBRUARY_OPERATED_AT, [credit(savings.id, category.id), fee(savings.id, null)]);
    seedTransaction(TransactionTypeEnum.EXPENSE, JANUARY_OPERATED_AT, [credit(debt.id, null)]);
    seedTransaction(TransactionTypeEnum.EXPENSE, FEBRUARY_OPERATED_AT, [credit(card.id, category.id), credit(savings.id, null)]);
    seedTransaction(TransactionTypeEnum.EXPENSE, FEBRUARY_OPERATED_AT, [credit(card.id, category.id)], tag.id);
    seedTransaction(TransactionTypeEnum.INCOME, JANUARY_OPERATED_AT, [
        { accountId: savings.id, type: TransactionEntryTypeEnum.DEBIT, amount: nextAmount(), categoryId: null }
    ]);

    const transfer = seed.directTransfer({
        exchangeRate: 1,
        operatedAt: JANUARY_OPERATED_AT,
        sourceAccountId: card.id,
        sourceAmount: nextAmount(),
        sourceEntryExchangeRate: 1,
        targetAccountId: savings.id,
        targetAmount: nextAmount(),
        toIban: null
    });
    seed.feeEntry(transfer.id, null, { accountId: card.id, amount: PRECISION });
    seed.refundedExpense({ accountId: card.id, expenseAmount: nextAmount(), refundAmounts: [PRECISION * 3] });
    await run(transferConsolidationService.consolidate(null));

    return { card, savings };
};

const buildFilters = (scope: ScopeInterface): TransactionFilterInterface => ({
    ...DEFAULT_TRANSACTION_FILTER,
    types: [scope.type],
    accountIds: scope.accountIds,
    date: scope.date
});

const countDistinctTransactions = (rows: readonly { readonly transactionId: number }[]): number =>
    new Set(rows.map(row => row.transactionId)).size;

const countStatisticsTransactions = async (scope: ScopeInterface, categoryIds: number[] | null, tagIds: number[] | null) => {
    const transactions = await statisticsRepository.getTransactions(
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
};

describe('pill, inbox and statistics parity', () => {
    let scopes: ScopeInterface[] = [];

    beforeEach(async () => {
        amountSequence = 0;
        const { card, savings } = await seedParityLedger();

        scopes = [
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
        ];
    });

    it('counts the same uncategorized transactions in the pill, the inbox and the statistics bucket', async () => {
        for (const scope of scopes) {
            const filters = buildFilters(scope);
            const [pill] = await transactionRepository.countUncategorized(filters);
            const inboxRows = await transactionCategorizeInboxRepository.findUncategorizedRows(filters);
            const statisticsCount = await countStatisticsTransactions(scope, [], null);

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
    });

    it('counts the same untagged transactions in the tag inbox and the statistics bucket', async () => {
        for (const scope of scopes) {
            const inboxRows = await transactionCategorizeInboxRepository.findUntaggedRows(buildFilters(scope));
            const statisticsCount = await countStatisticsTransactions(scope, null, []);

            expect({ scope: scope.name, inbox: countDistinctTransactions(inboxRows), statistics: statisticsCount }).toEqual({
                scope: scope.name,
                inbox: scope.untagged,
                statistics: scope.untagged
            });
        }
    });

    it('never treats transfers with uncategorized legs as uncategorized', async () => {
        const transferFilters = { ...DEFAULT_TRANSACTION_FILTER, types: [TransactionTypeEnum.TRANSFER] };
        const uncategorizedListFilters = { ...DEFAULT_TRANSACTION_FILTER, categoryIds: [] };
        const [transferPill] = await transactionRepository.countUncategorized(transferFilters);
        const transferInboxRows = await transactionCategorizeInboxRepository.findUncategorizedRows(transferFilters);
        const [transferListCount] = await transactionRepository.countAll({ ...transferFilters, categoryIds: [] });
        const [pill] = await transactionRepository.countUncategorized(DEFAULT_TRANSACTION_FILTER);
        const uncategorizedList = await transactionRepository.getAll(1000, uncategorizedListFilters, LanguageEnum.EN);
        const statisticsTransactions = await statisticsRepository.getTransactions(
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
    });
});
