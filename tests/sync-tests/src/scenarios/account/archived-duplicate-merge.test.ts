import {
    AccountEntityTable,
    AccountRepository,
    AccountTypeEnum,
    ExternalSourceEnum,
    RecurringSeriesEntityTable,
    RecurringSeriesKindEnum,
    RecurringSeriesStatusEnum,
    RecurringSeriesUserStateEnum,
    TransactionEntityTable
} from '@budgie/contracts';
import { SyncRepairService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer, testQueryService } from '../../harness';
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
    yield* testDb.update(TransactionEntityTable).set({ fundAccountId: liveCard.id }).where(eq(TransactionEntityTable.id, purchase.id));
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
            expect(yield* fetchSeriesAccountId(series.id)).toBe(archivedCard.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
