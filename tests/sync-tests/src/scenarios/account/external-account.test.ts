import {
    AccountBalanceRepository,
    AccountEntityTable,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    PRECISION,
    RuleActionTypeEnum,
    StatisticsRepository,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import {
    ExternalAccountService,
    SyncRepairService,
    TransferConsolidationService,
    UnpairedOwnCardTransferRepairService
} from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer, testQueryService } from '../../harness';
import {
    buildOwnCardRow,
    fetchVisibleTransactions,
    summarize,
    makeOwnCardStatementService,
    buildOwnCardStatementClient,
    seedOwnCard
} from '../../harness/file-sync/privatbank-own-card-statement';
import { seedTitleRule } from '../../harness/seed/seed-title-rule';

const EXTERNAL_CARD = '4000 **** **** 9174';
const LIVE_CARD = '4000 **** **** 8522';
const STATEMENT_URI = 'privatbank-statement.xlsx';
const OPERATED_AT = new Date('2026-03-04T09:15:00.000Z');

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

const fetchIncomeTotal = Effect.fnUntraced(function* () {
    const statisticsRepository = yield* StatisticsRepository;
    const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, 1);

    return totals.income;
});

const ownCardStatementClient = buildOwnCardStatementClient([
    buildOwnCardRow(EXTERNAL_CARD, -500, 'На мою картку *8522'),
    buildOwnCardRow(LIVE_CARD, 500, 'Зі своєї картки *9174')
]);

describe('account/external-account', () => {
    it.effect('stores transfers with an external account as income and expense on the live card and keeps them converted', () =>
        Effect.gen(function* () {
            const externalAccountService = yield* ExternalAccountService;
            const syncRepairService = yield* SyncRepairService;
            const unpairedOwnCardTransferRepairService = yield* UnpairedOwnCardTransferRepairService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const rentCategory = yield* seed.category('Rent');
            const externalCard = yield* seedOwnCard(EXTERNAL_CARD);
            const liveCard = yield* seedOwnCard(LIVE_CARD);
            const incoming = yield* seedOwnCardTransfer(externalCard.id, liveCard.id, 100 * PRECISION, 'Зі своєї картки *9174');
            const outgoing = yield* seedOwnCardTransfer(liveCard.id, externalCard.id, 40 * PRECISION, 'На мою картку *9174');

            yield* seed.feeEntry(outgoing.id, 'external-account-fee', { accountId: liveCard.id, amount: PRECISION });
            yield* seedTitleRule('*9174', { type: RuleActionTypeEnum.SET_CATEGORY, categoryId: rentCategory.id, accountId: null });

            const liveBalanceBefore = yield* accountBalanceRepository.getLedgerBalances([liveCard.id]);
            const incomeBefore = yield* fetchIncomeTotal();

            yield* externalAccountService.markExternal(externalCard.id);
            yield* (yield* AccountArchiveService).restoreById(externalCard.id);

            const [restoredExternalCard] = yield* testDb
                .select()
                .from(AccountEntityTable)
                .where(eq(AccountEntityTable.id, externalCard.id));

            expect(restoredExternalCard.deletedAt).toBeInstanceOf(Date);
            expect(restoredExternalCard.isExternal).toBe(true);

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
            const externalCard = yield* seedOwnCard(EXTERNAL_CARD);
            const liveCard = yield* seedOwnCard(LIVE_CARD);
            const syncService = yield* makeOwnCardStatementService(ownCardStatementClient);

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
