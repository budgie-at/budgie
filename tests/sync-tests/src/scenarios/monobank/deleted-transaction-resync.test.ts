import {
    ExternalSourceEnum,
    PRECISION,
    SyncRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { AccountArchiveService, TransactionService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, MonobankSyncService, setupMonobankFixture, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

import type { StatementItem } from '@liaugust/monobank-sdk';

const EXTERNAL_ID = 'tx-deleted';
const DAY_MS = 24 * 60 * 60 * 1000;

const fetchRows = () => testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, EXTERNAL_ID));

const expectOnlyTombstone = Effect.map(Effect.suspend(fetchRows), rows => {
    expect(rows).toHaveLength(1);
    expect(rows[0].deletedAt).not.toBeNull();
});

const syncThenDelete = Effect.gen(function* () {
    const monobankSyncService = yield* MonobankSyncService;
    const transactionService = yield* TransactionService;
    const { account } = yield* setupMonobankFixture();
    const payload = buildMonobank.transaction({ id: EXTERNAL_ID, amount: -2500, hold: false });

    monobankStub.statement([payload]);
    yield* monobankSyncService.sync();
    const [transaction] = yield* fetchRows();
    yield* transactionService.deleteById(transaction.id);

    return { account, payload };
});

const resyncWith = (accountId: number, payload: StatementItem) =>
    Effect.gen(function* () {
        const monobankSyncService = yield* MonobankSyncService;
        const syncRepository = yield* SyncRepository;

        yield* syncRepository.resetForWindowedResync(accountId, new Date(2026, 0, 1));
        monobankStub.statementBatches([[payload]]);
        yield* monobankSyncService.sync();
    });

describe('monobank/deleted-transaction-resync', () => {
    it.effect('keeps a deleted synced transaction deleted when a re-sync returns it again', () =>
        Effect.gen(function* () {
            const { account, payload } = yield* syncThenDelete;

            yield* resyncWith(account.id, payload);

            yield* expectOnlyTombstone;
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a transaction deleted a day earlier deleted after its account is archived, restored and re-synced', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const { account, payload } = yield* syncThenDelete;
            yield* testDb
                .update(TransactionEntityTable)
                .set({ deletedAt: new Date(Date.now() - DAY_MS) })
                .where(eq(TransactionEntityTable.externalId, EXTERNAL_ID));

            yield* accountArchiveService.archiveById(account.id);
            yield* accountArchiveService.restoreById(account.id);
            yield* resyncWith(account.id, payload);

            yield* expectOnlyTombstone;
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('re-creates rows of an archived account on a newly linked account', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const accountArchiveService = yield* AccountArchiveService;
            const { account } = yield* setupMonobankFixture();
            const oldPayload = buildMonobank.transaction({ id: 'tx-old', amount: -2500, hold: false });

            monobankStub.statement([oldPayload]);
            yield* monobankSyncService.sync();
            yield* accountArchiveService.archiveById(account.id);
            const { account: linkedAccount } = yield* setupMonobankFixture('mono-acc-2');
            monobankStub.statement([oldPayload, buildMonobank.transaction({ id: 'tx-new', amount: -1000, hold: false })]);
            yield* monobankSyncService.sync();

            const liveRows = yield* testDb
                .select()
                .from(TransactionEntityTable)
                .where(and(eq(TransactionEntityTable.fromAccountId, linkedAccount.id), isNull(TransactionEntityTable.deletedAt)));
            expect(liveRows).toHaveLength(2);
            expect(liveRows.map(row => row.externalId)).toEqual(expect.arrayContaining(['tx-new', 'tx-old']));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps updating a live row that shares its id with a soft-deleted copy', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const { account } = yield* setupMonobankFixture();

            monobankStub.statement([buildMonobank.transaction({ id: EXTERNAL_ID, amount: -2500, hold: false })]);
            yield* monobankSyncService.sync();
            yield* insertOne(TransactionEntityTable, {
                type: TransactionTypeEnum.EXPENSE,
                title: 'Soft-deleted copy',
                externalId: EXTERNAL_ID,
                externalSource: ExternalSourceEnum.MONOBANK,
                comment: '',
                fromAccountId: account.id,
                toAccountId: null,
                exchangeRate: 1,
                deletedAt: new Date()
            });

            yield* resyncWith(account.id, buildMonobank.transaction({ id: EXTERNAL_ID, amount: -3000, hold: false }));

            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, EXTERNAL_ID));
            expect(entries.map(entry => entry.amount)).toStrictEqual([30 * PRECISION]);
        }).pipe(Effect.provide(TestLayer))
    );
});
