import {
    AccountEntityTable,
    AccountRepository,
    AccountTypeEnum,
    ExternalSourceEnum,
    RecurringSeriesEntityTable,
    RecurringSeriesKindEnum,
    RecurringSeriesStatusEnum,
    RecurringSeriesUserStateEnum,
    SyncModeEnum,
    SyncRepository,
    AccountBalanceRepository,
    TransactionEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import {
    AccountArchiveService,
    AccountBalanceIncrementalService,
    BalanceAdjustmentService,
    TransactionTransferService
} from '@budgie/ledger';
import { SyncRepairService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull, or } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, fetchCachedBalanceAmount, seed, testDb, TestLayer, testQueryService } from '../../harness';
import {
    buildOwnCardRow,
    buildOwnCardStatementClient,
    makeOwnCardStatementService
} from '../../harness/file-sync/privatbank-own-card-statement';

const MONOBANK_CARD = 'monobank-card-1';
const PRIVATBANK_CARD = '4000 **** **** 7777';
const OPERATED_AT = new Date('2026-03-04T09:15:00.000Z');

const seedMonobankCard = () =>
    seed.account({
        title: 'Monobank card',
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.MONOBANK,
        externalId: MONOBANK_CARD
    });

const seedArchivedDuplicate = Effect.gen(function* () {
    const archivedCard = yield* seedMonobankCard();
    yield* testDb.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, archivedCard.id));
    const liveCard = yield* seedMonobankCard();
    const purchase = yield* seed.bankPairExpense(
        { externalId: 'monobank-purchase', operatedAt: OPERATED_AT },
        { accountId: liveCard.id, amount: 1_000_000 }
    );
    yield* testDb
        .update(TransactionEntityTable)
        .set({ fundAccountId: liveCard.id, yieldSourceAccountId: liveCard.id })
        .where(eq(TransactionEntityTable.id, purchase.id));
    const [series] = yield* testDb
        .insert(RecurringSeriesEntityTable)
        .values({
            merchantKey: 'NETFLIX',
            kind: RecurringSeriesKindEnum.EXPENSE,
            periodDays: 30,
            amount: 1_000_000,
            status: RecurringSeriesStatusEnum.ACTIVE,
            userState: RecurringSeriesUserStateEnum.SUGGESTED,
            title: 'NETFLIX',
            lastSeenAt: OPERATED_AT,
            accountId: liveCard.id
        })
        .returning();

    return { archivedCard, liveCard, purchase, series };
});

const fetchSeriesAccountId = (seriesId: number) =>
    Effect.map(
        testDb.select().from(RecurringSeriesEntityTable).where(eq(RecurringSeriesEntityTable.id, seriesId)),
        rows => rows.at(0)?.accountId
    );

describe('account/archived-duplicate-merge', () => {
    it.effect('leaves an archived duplicate of another provider alone on a file import', () =>
        Effect.gen(function* () {
            const { archivedCard, liveCard } = yield* seedArchivedDuplicate;
            const statement = buildOwnCardStatementClient([buildOwnCardRow(PRIVATBANK_CARD, -100, 'Покупка')]);

            yield* (yield* makeOwnCardStatementService(statement)).executeImportForSelectedAccounts('statement.xlsx', [PRIVATBANK_CARD]);

            const accounts = yield* (yield* AccountRepository).findByExternalIds([MONOBANK_CARD]);

            expect(accounts.map(account => account.id)).toEqual([liveCard.id]);
            expect((yield* (yield* AccountRepository).findByIdIncludingArchived(archivedCard.id))?.deletedAt).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('folds the live duplicate into the archived account through the sync repairs, keeping every reference', () =>
        Effect.gen(function* () {
            const syncRepairService = yield* SyncRepairService;
            const { archivedCard, purchase, series } = yield* seedArchivedDuplicate;

            expect((yield* syncRepairService.previewDuplicates()).duplicateTransactionCount).toBe(1);
            yield* syncRepairService.removeDuplicates();

            const accounts = yield* (yield* AccountRepository).findByExternalIds([MONOBANK_CARD]);
            const movedPurchase = yield* testQueryService.findTransactionById(purchase.id);

            expect(accounts.map(account => account.id)).toEqual([archivedCard.id]);
            expect(movedPurchase.fromAccountId).toBe(archivedCard.id);
            expect(movedPurchase.fundAccountId).toBe(archivedCard.id);
            expect(movedPurchase.yieldSourceAccountId).toBe(archivedCard.id);
            expect(yield* fetchSeriesAccountId(series.id)).toBe(archivedCard.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps an archived transfer with a leg on another account and drops the one-sided live copy', () =>
        Effect.gen(function* () {
            const syncRepairService = yield* SyncRepairService;
            const archivedCard = yield* seedMonobankCard();
            const savings = yield* seed.account({ title: 'Savings' });
            const archivedTransfer = yield* seed.bankPairExpense(
                { externalId: 'monobank-shared-transfer', operatedAt: OPERATED_AT },
                { accountId: archivedCard.id, amount: 1_000_000 }
            );

            yield* (yield* TransactionTransferService).convertExpenseToTransfer({
                id: archivedTransfer.id,
                accountId: savings.id,
                customExchangeRate: 1,
                feeEntries: []
            });
            yield* (yield* AccountArchiveService).archiveById(archivedCard.id);
            const liveCard = yield* seedMonobankCard();
            const liveCopy = yield* seed.bankPairExpense(
                { externalId: 'monobank-shared-transfer', operatedAt: OPERATED_AT },
                { accountId: liveCard.id, amount: 1_000_000 }
            );

            yield* syncRepairService.removeDuplicates();

            expect((yield* testQueryService.findTransactionById(archivedTransfer.id)).deletedAt).toBeNull();
            expect((yield* testQueryService.findTransactionById(liveCopy.id)).deletedAt).not.toBeNull();
            expect(yield* fetchAccountBalance(savings.id)).toBe(1_000_000);
            expect(yield* fetchAccountBalance(archivedCard.id)).toBe(-1_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps only the surviving sync setup adjustment when both cards had one', () =>
        Effect.gen(function* () {
            const syncRepository = yield* SyncRepository;
            const balanceAdjustmentService = yield* BalanceAdjustmentService;
            const { archivedCard, liveCard } = yield* seedArchivedDuplicate;
            const seedSetupBalance = (accountId: number, setupBalance: number) =>
                Effect.gen(function* () {
                    const sync = yield* syncRepository.create({
                        accountId,
                        provider: ExternalSourceEnum.MONOBANK,
                        enabled: true,
                        mode: SyncModeEnum.FORWARD
                    });
                    const adjustmentId = yield* balanceAdjustmentService.create(accountId, setupBalance, OPERATED_AT);

                    yield* syncRepository.update(sync.id, { setupBalance, balanceAdjustmentTransactionId: adjustmentId });
                });

            yield* seedSetupBalance(archivedCard.id, 5_000_000);
            yield* seedSetupBalance(liveCard.id, 7_000_000);
            yield* (yield* SyncRepairService).removeDuplicates();

            expect(yield* fetchAccountBalance(archivedCard.id)).toBe(6_000_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps only the surviving reconciliation adjustment when both cards were reconciled', () =>
        Effect.gen(function* () {
            const syncRepository = yield* SyncRepository;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const { archivedCard, liveCard } = yield* seedArchivedDuplicate;
            const reconciledAt = new Date(OPERATED_AT.getTime() + 86_400_000);
            const setArchived = (deletedAt: Date | null) =>
                testDb.update(AccountEntityTable).set({ deletedAt }).where(eq(AccountEntityTable.id, archivedCard.id));
            const seedReconciledSync = (accountId: number, reconciledBalance: number) =>
                Effect.gen(function* () {
                    const sync = yield* syncRepository.create({
                        accountId,
                        provider: ExternalSourceEnum.MONOBANK,
                        enabled: true,
                        mode: SyncModeEnum.FORWARD
                    });

                    yield* syncRepository.update(sync.id, { reconciledAt, reconciledBalance });
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([accountId]);
                });

            yield* setArchived(null);
            yield* seedReconciledSync(archivedCard.id, 5_000_000);
            yield* setArchived(new Date());
            yield* seedReconciledSync(liveCard.id, 7_000_000);
            yield* (yield* SyncRepairService).removeDuplicates();

            const adjustments = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(
                    and(
                        eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
                        isNull(TransactionEntityTable.deletedAt),
                        or(
                            eq(TransactionEntityTable.fromAccountId, archivedCard.id),
                            eq(TransactionEntityTable.toAccountId, archivedCard.id)
                        )
                    )
                );
            const survivingSync = yield* syncRepository.getByAccountId(archivedCard.id);
            const ledgerBalance = (yield* (yield* AccountBalanceRepository).getLedgerBalances([archivedCard.id])).get(archivedCard.id);

            expect(adjustments.map(adjustment => adjustment.id)).toEqual([survivingSync?.reconciliationTransactionId]);
            expect(survivingSync?.reconciledBalance).toBe(7_000_000);
            expect(yield* fetchCachedBalanceAmount(archivedCard.id)).toBe(7_000_000);
            expect(ledgerBalance).toBe(7_000_000);
        }).pipe(Effect.provide(TestLayer))
    );
});
