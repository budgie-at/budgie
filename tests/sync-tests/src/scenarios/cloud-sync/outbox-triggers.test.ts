import { SYNC_RECORD_DEFINITIONS, SyncOutboxRepository, SyncApplyService } from '@budgie/cloud-sync';
import {
    Db,
    SyncResetRepository,
    SyncRecordRepository,
    SyncOutboxOperationEnum,
    SyncIdentityRepository,
    TagSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionReceiptEntityTable,
    TransactionTagsEntityTable
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq, getTableColumns } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Schema from 'effect/Schema';

import { seed, testDb } from '../../harness';

import { onDevice } from './apply-harness';

interface OutboxRowInterface {
    readonly recordType: string;
    readonly syncId: string;
    readonly operation: string;
    readonly changedColumns: readonly string[];
    readonly syncRevision: number;
}

interface RawOutboxRowInterface extends Omit<OutboxRowInterface, 'changedColumns'> {
    readonly changedColumns: string;
}

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');

const decodeChangedColumns = Schema.decodeSync(Schema.fromJsonString(Schema.Array(Schema.String)));

const readOutbox = Effect.gen(function* () {
    const rows = yield* testDb.$client.unsafe<RawOutboxRowInterface>(
        `SELECT record_type AS recordType, sync_id AS syncId, operation, changed_columns AS changedColumns, sync_revision AS syncRevision FROM sync_outbox ORDER BY id`
    );

    return rows.map((row): OutboxRowInterface => ({ ...row, changedColumns: decodeChangedColumns(row.changedColumns) }));
});

const clearOutbox = testDb.$client.unsafe('DELETE FROM sync_outbox');

const syncIdOf = (tableName: string, rowid: number) =>
    testDb.$client
        .unsafe<{ readonly syncId: string }>(`SELECT sync_id AS syncId FROM ${tableName} WHERE rowid = ?`, [rowid])
        .pipe(Effect.map(([row]) => row.syncId));

const setApplying = (isApplying: boolean) =>
    testDb.$client.unsafe(
        `INSERT INTO sync_apply_state (id, is_applying) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET is_applying = excluded.is_applying`,
        [isApplying ? 1 : 0]
    );

const seedExpense = Effect.gen(function* () {
    const account = yield* seed.account({ title: 'Cash' });
    const transaction = yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: OPERATED_AT, title: 'Cafe' });
    const [entry] = yield* testDb
        .select()
        .from(TransactionEntryEntityTable)
        .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));
    const transactionSyncId = yield* syncIdOf('transactions', transaction.id);

    yield* clearOutbox;

    return { account, transaction, entry, transactionSyncId };
});

const expectSingleTransactionSave = (rows: readonly OutboxRowInterface[], syncId: string, syncRevision?: number) => {
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
        recordType: 'Transaction',
        syncId,
        operation: SyncOutboxOperationEnum.SAVE,
        ...(syncRevision !== undefined && { syncRevision })
    });
};

const expectSingleSave = (rows: readonly OutboxRowInterface[], recordType: string, syncId: string, changedColumns: readonly string[]) => {
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ recordType, syncId, operation: 'SAVE' });
    expect([...rows[0].changedColumns].sort()).toEqual([...changedColumns].sort());
};

describe('cloud-sync/outbox-triggers', () => {
    it.effect('keeps account ownership tombstones when resetting sync state', () =>
        onDevice(
            testDb,
            Effect.gen(function* () {
                const records = yield* SyncRecordRepository;
                yield* records.upsert({
                    syncZone: 'personal',
                    syncId: 'own-shared-account',
                    recordType: 'Account',
                    payload: '{"encryptedFields":{"movedTo":"household"}}',
                    systemFields: null
                });
                yield* (yield* SyncResetRepository).clearSyncState();
                yield* (yield* SyncOutboxRepository).enqueueAll('personal');
                expect(yield* records.find('personal', 'own-shared-account')).toBeDefined();
                expect(
                    yield* testDb.$client.unsafe("SELECT operation, changed_columns FROM sync_outbox WHERE sync_id = 'own-shared-account'")
                ).toEqual([{ operation: 'DELETE', changed_columns: '["@movedTo:household"]' }]);
            }).pipe(Effect.provide(SyncResetRepository.layer))
        )
    );

    it.effect('keeps seed categories, translations and MCC links when adopting cloud data', () =>
        onDevice(
            testDb,
            Effect.gen(function* () {
                const before = yield* testDb.$client.unsafe(
                    'SELECT m.id, m.default_category_id, c.sync_id FROM mcc_categories m INNER JOIN categories c ON c.id = m.default_category_id WHERE c.is_default = 1 ORDER BY m.id'
                );
                const translations = yield* testDb.$client.unsafe(
                    'SELECT category_id, language, title FROM default_category_translations ORDER BY category_id, language'
                );
                expect(before.length).toBeGreaterThan(0);
                expect(translations.length).toBeGreaterThan(0);
                yield* (yield* SyncResetRepository).clearSyncedData();
                expect(
                    yield* testDb.$client.unsafe(
                        'SELECT m.id, m.default_category_id, c.sync_id FROM mcc_categories m INNER JOIN categories c ON c.id = m.default_category_id WHERE c.is_default = 1 ORDER BY m.id'
                    )
                ).toEqual(before);
                expect(
                    yield* testDb.$client.unsafe(
                        'SELECT category_id, language, title FROM default_category_translations ORDER BY category_id, language'
                    )
                ).toEqual(translations);
            }).pipe(Effect.provide(SyncResetRepository.layer))
        )
    );

    it.effect('retains all paused records when resume cannot decode a later payload', () =>
        onDevice(
            testDb,
            Effect.gen(function* () {
                yield* testDb.$client.unsafe(
                    "INSERT INTO sync_pending (sync_zone, sync_id, record_type, missing_record_type, missing_sync_id, payload) VALUES ('personal', 'first', 'Account', 'SchemaVersion', 'personal', '{}'), ('personal', 'second', 'Account', 'SchemaVersion', 'personal', 'invalid')"
                );
                expect(Exit.isFailure(yield* Effect.exit((yield* SyncApplyService).resume()))).toBe(true);
                expect(yield* testDb.$client.unsafe('SELECT sync_id FROM sync_pending ORDER BY id')).toEqual([
                    { sync_id: 'first' },
                    { sync_id: 'second' }
                ]);
            })
        )
    );

    it.effect('unions explicit enqueues with pending title edits', () =>
        onDevice(
            testDb,
            Effect.gen(function* () {
                const { transactionSyncId } = yield* seedExpense;
                yield* clearOutbox;
                const repository = yield* SyncOutboxRepository;
                yield* repository.enqueue({
                    recordType: 'Transaction',
                    syncZone: 'personal',
                    syncId: transactionSyncId,
                    operation: SyncOutboxOperationEnum.SAVE,
                    changedColumns: '["title"]'
                });
                yield* repository.enqueue({
                    recordType: 'Transaction',
                    syncZone: 'personal',
                    syncId: transactionSyncId,
                    operation: SyncOutboxOperationEnum.SAVE,
                    changedColumns: '["transaction_entries"]'
                });
                expect((yield* readOutbox)[0].changedColumns).toEqual(['title', 'transaction_entries']);
                const revision = (yield* readOutbox)[0].syncRevision;

                yield* repository.replaceChangedColumns('personal', transactionSyncId, '["title"]');
                expect((yield* readOutbox)[0].changedColumns).toEqual(['title']);
                expect((yield* readOutbox)[0].syncRevision).toBe(revision + 1);
            })
        )
    );

    it.effect('captures every synced column in each update trigger', () =>
        Effect.gen(function* () {
            for (const definition of Object.values(SYNC_RECORD_DEFINITIONS)) {
                for (const descriptor of [definition.parent, ...definition.children.map(child => child.descriptor)]) {
                    const [trigger] = yield* testDb.$client.unsafe<{ readonly sql: string }>(
                        "SELECT sql FROM sqlite_master WHERE type = 'trigger' AND name = ?",
                        [`${descriptor.tableName}_sync_outbox_update`]
                    );
                    expect(trigger).toBeDefined();
                    if (descriptor === definition.parent) {
                        for (const column of descriptor.columns) {
                            expect(trigger.sql).toContain(getTableColumns(descriptor.table)[column.property].name);
                        }
                    } else {
                        expect(trigger.sql).toContain(`AFTER UPDATE ON \`${descriptor.tableName}\``);
                        expect(trigger.sql).toContain(descriptor.tableName);
                    }
                }
            }
        })
    );

    it.effect('enqueues one transaction record when a transaction and its entry are created', () =>
        Effect.gen(function* () {
            const account = yield* seed.account({ title: 'Cash' });

            yield* clearOutbox;

            const transaction = yield* seed.manualExpense({
                accountId: account.id,
                amount: 5_000_000,
                operatedAt: OPERATED_AT,
                title: 'Cafe'
            });
            const rows = yield* readOutbox;
            const transactionSyncId = yield* syncIdOf('transactions', transaction.id);

            expectSingleTransactionSave(rows, transactionSyncId, 2);
            expect(rows[0].changedColumns).toEqual(expect.arrayContaining(['title', 'operated_at', 'type', 'transaction_entries']));
            expect(rows[0].changedColumns).not.toContain('id');
            expect(rows[0].changedColumns).not.toContain('needs_embedding');
        })
    );

    it.effect('enqueues the changed columns when a transaction is edited', () =>
        Effect.gen(function* () {
            const { transaction, transactionSyncId } = yield* seedExpense;

            yield* testDb.update(TransactionEntityTable).set({ title: 'Lunch' }).where(eq(TransactionEntityTable.id, transaction.id));

            const rows = yield* readOutbox;

            expectSingleTransactionSave(rows, transactionSyncId, 1);
            expect(rows[0].changedColumns).toContain('title');
            expect(rows[0].changedColumns).not.toContain('operated_at');
        })
    );

    it.effect('enqueues a save, not a delete, for a soft-deleted transaction', () =>
        Effect.gen(function* () {
            const { transaction, transactionSyncId } = yield* seedExpense;

            yield* testDb
                .update(TransactionEntityTable)
                .set({ deletedAt: new Date() })
                .where(eq(TransactionEntityTable.id, transaction.id));

            const rows = yield* readOutbox;

            expectSingleTransactionSave(rows, transactionSyncId);
            expect(rows[0].changedColumns).toContain('deleted_at');
        })
    );

    it.effect('enqueues the parent transaction when an entry is edited', () =>
        Effect.gen(function* () {
            const { entry, transactionSyncId } = yield* seedExpense;

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: 6_000_000 })
                .where(eq(TransactionEntryEntityTable.id, entry.id));

            expectSingleSave(yield* readOutbox, 'Transaction', transactionSyncId, ['transaction_entries']);
        })
    );

    it.effect('enqueues the parent transaction when a tag is added and when the last tag is removed', () =>
        Effect.gen(function* () {
            const { transaction, transactionSyncId } = yield* seedExpense;
            const tag = yield* seed.tag('Coffee');

            yield* clearOutbox;
            yield* seed.transactionTag(transaction.id, tag.id, TagSourceEnum.USER);

            expectSingleSave(yield* readOutbox, 'Transaction', transactionSyncId, ['transaction_tags']);

            yield* clearOutbox;
            yield* testDb.delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.transactionId, transaction.id));

            expectSingleSave(yield* readOutbox, 'Transaction', transactionSyncId, ['transaction_tags']);
        })
    );

    it.effect('enqueues the parent transaction when a receipt is deleted', () =>
        Effect.gen(function* () {
            const { transaction, transactionSyncId } = yield* seedExpense;

            yield* testDb
                .insert(TransactionReceiptEntityTable)
                .values({ transactionId: transaction.id, fingerprint: 'receipt-fingerprint' });
            yield* clearOutbox;
            yield* testDb.delete(TransactionReceiptEntityTable).where(eq(TransactionReceiptEntityTable.transactionId, transaction.id));

            expectSingleSave(yield* readOutbox, 'Transaction', transactionSyncId, ['transaction_receipts']);
        })
    );

    it.effect('enqueues both transactions when an entry moves between them', () =>
        Effect.gen(function* () {
            const { account, entry, transaction, transactionSyncId } = yield* seedExpense;
            const other = yield* seed.manualExpense({ accountId: account.id, amount: 1_000_000, operatedAt: OPERATED_AT, title: 'Other' });
            const otherSyncId = yield* syncIdOf('transactions', other.id);

            yield* clearOutbox;
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ transactionId: other.id })
                .where(eq(TransactionEntryEntityTable.id, entry.id));

            const rows = yield* readOutbox;

            expect(transaction.id).not.toBe(other.id);
            expect(rows.map(row => row.syncId).sort()).toEqual([transactionSyncId, otherSyncId].sort());
            expect(rows.every(row => row.recordType === 'Transaction' && row.operation === 'SAVE')).toBe(true);
            expect(rows.every(row => row.changedColumns.length === 1 && row.changedColumns[0] === 'transaction_entries')).toBe(true);
        })
    );

    it.effect('enqueues a tombstone for a hard-deleted record and a save when the same id is inserted again', () =>
        Effect.gen(function* () {
            const tag = yield* seed.tag('Temporary');
            const tagSyncId = yield* syncIdOf('tags', tag.id);

            yield* clearOutbox;
            yield* testDb.$client.unsafe('DELETE FROM tags WHERE id = ?', [tag.id]);

            const afterDelete = yield* readOutbox;

            expect(afterDelete).toEqual([
                { recordType: 'Tag', syncId: tagSyncId, operation: 'DELETE', changedColumns: [], syncRevision: 1 }
            ]);

            yield* testDb.$client.unsafe(`INSERT INTO tags (sync_id, title, title_search) VALUES (?, 'Temporary', 'temporary')`, [
                tagSyncId
            ]);

            const afterReinsert = yield* readOutbox;

            expect(afterReinsert).toHaveLength(1);
            expect(afterReinsert[0]).toMatchObject({ recordType: 'Tag', syncId: tagSyncId, operation: 'SAVE', syncRevision: 2 });
            expect(afterReinsert[0].changedColumns).toEqual(expect.arrayContaining(['title', 'created_at']));
        })
    );

    it.effect('merges changed columns and bumps the revision on repeated edits of one record', () =>
        Effect.gen(function* () {
            const tag = yield* seed.tag('Merge');
            const tagSyncId = yield* syncIdOf('tags', tag.id);

            yield* clearOutbox;
            yield* testDb.$client.unsafe(`UPDATE tags SET title = 'Merged' WHERE id = ?`, [tag.id]);
            yield* testDb.$client.unsafe(`UPDATE tags SET deleted_at = unixepoch() WHERE id = ?`, [tag.id]);

            const rows = yield* readOutbox;

            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({ syncId: tagSyncId, operation: 'SAVE', syncRevision: 2 });
            expect(rows[0].changedColumns).toEqual(['deleted_at', 'title']);
        })
    );

    it.effect('captures raw writes and ignores columns that never leave the device', () =>
        Effect.gen(function* () {
            const { account } = yield* seedExpense;
            const accountSyncId = yield* syncIdOf('accounts', account.id);

            yield* testDb.$client.unsafe(`UPDATE accounts SET title = 'Wallet' WHERE id = ?`, [account.id]);

            expectSingleSave(yield* readOutbox, 'Account', accountSyncId, ['title']);

            yield* clearOutbox;
            yield* testDb.$client.unsafe(`UPDATE accounts SET title_search = 'wallet' WHERE id = ?`, [account.id]);

            expect(yield* readOutbox).toEqual([]);

            yield* testDb.$client.unsafe(
                `INSERT INTO tags (sync_id, title, title_search) VALUES (lower(hex(randomblob(16))), 'Raw', 'raw')`
            );

            const rows = yield* readOutbox;

            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({ recordType: 'Tag', operation: 'SAVE' });
        })
    );

    it.effect('enqueues nothing for rows whose sync id is still pending backfill', () =>
        Effect.gen(function* () {
            const { account } = yield* seedExpense;

            yield* testDb.$client.unsafe(`INSERT INTO tags (title, title_search) VALUES ('Pending', 'pending')`);
            yield* testDb.$client.unsafe(`UPDATE tags SET title = 'Still pending' WHERE title = 'Pending'`);
            yield* testDb.$client.unsafe(`UPDATE accounts SET sync_id = NULL WHERE id = ?`, [account.id]);
            yield* clearOutbox;
            yield* testDb.$client.unsafe(`UPDATE accounts SET title = 'Renamed' WHERE id = ?`, [account.id]);

            expect(yield* readOutbox).toEqual([]);
        })
    );

    it.effect('enqueues nothing while remote changes are being applied', () =>
        Effect.gen(function* () {
            const { account, entry, transaction, transactionSyncId } = yield* seedExpense;
            const tag = yield* seed.tag('Applied');

            yield* clearOutbox;
            yield* setApplying(true);
            yield* testDb
                .update(TransactionEntityTable)
                .set({ title: 'Remote title' })
                .where(eq(TransactionEntityTable.id, transaction.id));
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: 7_000_000 })
                .where(eq(TransactionEntryEntityTable.id, entry.id));
            yield* seed.transactionTag(transaction.id, tag.id, TagSourceEnum.USER);
            yield* seed.manualExpense({ accountId: account.id, amount: 1_000_000, operatedAt: OPERATED_AT, title: 'Remote' });
            yield* testDb.$client.unsafe('DELETE FROM tags WHERE id = ?', [tag.id]);

            expect(yield* readOutbox).toEqual([]);

            yield* setApplying(false);
            yield* testDb.update(TransactionEntityTable).set({ title: 'Local title' }).where(eq(TransactionEntityTable.id, transaction.id));

            const rows = yield* readOutbox;

            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({ syncId: transactionSyncId, operation: 'SAVE' });
        })
    );

    it.live('does not enqueue the backfill of pending sync ids', () =>
        Effect.gen(function* () {
            yield* seed.account({ title: 'Legacy' });
            yield* testDb.$client.unsafe('UPDATE accounts SET sync_id = NULL');
            yield* testDb.$client.unsafe(`INSERT INTO tags (title, title_search) VALUES ('Legacy tag', 'legacy tag')`);
            yield* clearOutbox;

            const syncIdentityRepository = yield* SyncIdentityRepository;

            yield* syncIdentityRepository.backfill();

            const missing = yield* syncIdentityRepository.countMissing();
            const rows = yield* readOutbox;

            expect(missing).toBe(0);
            expect(rows).toEqual([]);
        }).pipe(Effect.provide(SyncIdentityRepository.layer), Effect.provideService(Db, testDb))
    );
});
