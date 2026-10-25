import {
    AccountBalanceRepository,
    AccountEntityTable,
    AccountTypeEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    PRECISION,
    RuleActionTypeEnum,
    StatisticsRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import {
    ExternalAccountService,
    SyncAccountBalanceStateEnum,
    SyncAccountTypeEnum,
    SyncProviderEnum,
    SyncRepairService,
    TransferConsolidationService,
    UnpairedOwnCardTransferRepairService,
    privatbankTransactionMapper
} from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { makeStubFileBankSyncService, seed, testDb, TestLayer, testQueryService } from '../../harness';
import { seedTitleRule } from '../../harness/seed/seed-title-rule';

import type { TransactionEntityInterface } from '@budgie/contracts';
import type { FileBasedSyncClientInterface, PrivatbankRowInterface } from '@budgie/sync';

const EXTERNAL_CARD = '4000 **** **** 9174';
const LIVE_CARD = '4000 **** **** 8522';
const STATEMENT_URI = 'privatbank-statement.xlsx';
const OPERATED_AT = new Date('2026-03-04T09:15:00.000Z');

const seedCard = (card: string) =>
    seed.account({
        title: `Privatbank •${card.slice(-4)}`,
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        externalId: card,
        iban: `UA00PRIVATBANK${card.slice(-4)}`
    });

const seedOwnCardTransfer = (sourceAccountId: number, targetAccountId: number, amount: number, title: string, operatedAt = OPERATED_AT) =>
    Effect.gen(function* () {
        const transfer = yield* seed.directTransfer({
            exchangeRate: 1,
            operatedAt,
            sourceAccountId,
            sourceAmount: amount,
            sourceEntryExchangeRate: 1,
            targetAccountId,
            targetAmount: amount,
            toIban: null
        });

        return yield* seed.updateTransaction(transfer.id, { externalSource: ExternalSourceEnum.PRIVATBANK, title });
    });

const fetchLiveEntries = (accountId: number) =>
    testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(and(eq(TransactionEntryEntityTable.accountId, accountId), isNull(TransactionEntryEntityTable.deletedAt)));

const fetchVisibleTransactions = () =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(and(isNull(TransactionEntityTable.deletedAt), isNull(TransactionEntityTable.consolidationParentTransactionId)));

const summarize = (transactions: Pick<TransactionEntityInterface, 'type' | 'fromAccountId' | 'toAccountId'>[]) =>
    transactions.map(transaction => [transaction.type, transaction.fromAccountId, transaction.toAccountId]);

const fetchIncomeTotal = Effect.fnUntraced(function* () {
    const statisticsRepository = yield* StatisticsRepository;
    const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, 1);

    return totals.income;
});

const buildRow = (card: string, cardAmount: number, description: string): PrivatbankRowInterface => ({
    rawDate: '04.03.2026 11:15:00',
    date: OPERATED_AT,
    deviceLocalDate: OPERATED_AT,
    category: 'Перекази',
    card,
    description,
    cardAmount,
    cardCurrency: 'UAH',
    operationAmount: Math.abs(cardAmount),
    operationCurrency: 'UAH',
    endBalance: 0,
    balanceCurrency: 'UAH'
});

const ownCardStatementClient: FileBasedSyncClientInterface = {
    getAccounts: () =>
        [EXTERNAL_CARD, LIVE_CARD].map(card => ({
            id: card,
            provider: SyncProviderEnum.PRIVATBANK,
            currencyCode: 'UAH',
            currencyCodeNumeric: 980,
            balance: 0,
            balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
            creditLimit: 0,
            type: SyncAccountTypeEnum.CARD
        })),
    getTransactions: accountId =>
        [buildRow(EXTERNAL_CARD, -500, 'На мою картку *8522'), buildRow(LIVE_CARD, 500, 'Зі своєї картки *9174')]
            .filter(row => row.card === accountId)
            .map(privatbankTransactionMapper)
};

describe('account/external-account', () => {
    it.effect('stores transfers with an external account as income and expense on the live card and keeps them converted', () =>
        Effect.gen(function* () {
            const externalAccountService = yield* ExternalAccountService;
            const syncRepairService = yield* SyncRepairService;
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const rentCategory = yield* seed.category('Rent');
            const externalCard = yield* seedCard(EXTERNAL_CARD);
            const liveCard = yield* seedCard(LIVE_CARD);
            const incoming = yield* seedOwnCardTransfer(externalCard.id, liveCard.id, 100 * PRECISION, 'Зі своєї картки *9174');
            const outgoing = yield* seedOwnCardTransfer(liveCard.id, externalCard.id, 40 * PRECISION, 'На мою картку *9174');

            yield* seed.feeEntry(outgoing.id, 'external-account-fee', { accountId: liveCard.id, amount: PRECISION });
            yield* seedTitleRule('*9174', { type: RuleActionTypeEnum.SET_CATEGORY, categoryId: rentCategory.id, accountId: null });

            const liveBalanceBefore = yield* accountBalanceRepository.getLedgerBalances([liveCard.id]);
            const incomeBefore = yield* fetchIncomeTotal();

            yield* externalAccountService.markExternal(externalCard.id);

            const postArchive = yield* seedOwnCardTransfer(
                externalCard.id,
                liveCard.id,
                60 * PRECISION,
                'Зі своєї картки *9174',
                new Date(Date.now() + 60_000)
            );

            expect((yield* syncRepairService.removeDuplicates()).repairedTransactionCount).toBe(1);
            expect((yield* syncRepairService.removeDuplicates()).repairedTransactionCount).toBe(0);
            expect(yield* unpairedOwnCardTransferRepairService.countCandidates()).toBe(0);

            const converted = yield* Effect.forEach([incoming, outgoing, postArchive], transaction =>
                testQueryService.findTransactionById(transaction.id)
            );
            const liveEntries = yield* fetchLiveEntries(liveCard.id);

            expect(summarize(converted)).toEqual([
                [TransactionTypeEnum.INCOME, null, liveCard.id],
                [TransactionTypeEnum.EXPENSE, liveCard.id, null],
                [TransactionTypeEnum.INCOME, null, liveCard.id]
            ]);
            expect(yield* fetchLiveEntries(externalCard.id)).toEqual([]);
            expect(liveEntries.filter(entry => entry.type !== TransactionEntryTypeEnum.FEE).map(entry => entry.categoryId)).toEqual([
                rentCategory.id,
                rentCategory.id,
                rentCategory.id
            ]);
            expect(liveEntries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE)).toHaveLength(1);
            expect(yield* fetchIncomeTotal()).toBe(incomeBefore + 160 * PRECISION);
            expect((yield* accountBalanceRepository.getLedgerBalances([liveCard.id])).get(liveCard.id)).toBe(
                (liveBalanceBefore.get(liveCard.id) ?? 0) + 60 * PRECISION
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a consolidated own-card transfer as income on the live card and skips the external card on re-import', () =>
        Effect.gen(function* () {
            const externalAccountService = yield* ExternalAccountService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const externalCard = yield* seedCard(EXTERNAL_CARD);
            const liveCard = yield* seedCard(LIVE_CARD);
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const syncService = yield* makeStubFileBankSyncService(
                ExternalSourceEnum.PRIVATBANK,
                ownCardStatementClient,
                new Map([['Перекази', { id: transferMcc.id, defaultCategoryId: null }]])
            );

            yield* syncService.executeImportForSelectedAccounts(STATEMENT_URI, [EXTERNAL_CARD, LIVE_CARD]);
            yield* transferConsolidationService.consolidate(null);

            const accountCount = (yield* testDb.select().from(AccountEntityTable)).length;

            expect(summarize(yield* fetchVisibleTransactions())).toEqual([[TransactionTypeEnum.TRANSFER, externalCard.id, liveCard.id]]);

            const rentCategory = yield* seed.category('Rent');

            yield* seedTitleRule('*9174', { type: RuleActionTypeEnum.SET_CATEGORY, categoryId: rentCategory.id, accountId: null });
            yield* externalAccountService.markExternal(externalCard.id);
            yield* syncService.executeImportForSelectedAccounts(STATEMENT_URI, [EXTERNAL_CARD, LIVE_CARD]);
            yield* transferConsolidationService.consolidate(null);

            expect(yield* testDb.select().from(AccountEntityTable)).toHaveLength(accountCount);
            expect(summarize(yield* fetchVisibleTransactions())).toEqual([[TransactionTypeEnum.INCOME, null, liveCard.id]]);
            expect(yield* fetchLiveEntries(externalCard.id)).toEqual([]);
            expect((yield* fetchLiveEntries(liveCard.id)).map(entry => entry.categoryId)).toEqual([rentCategory.id]);
        }).pipe(Effect.provide(TestLayer))
    );
});
