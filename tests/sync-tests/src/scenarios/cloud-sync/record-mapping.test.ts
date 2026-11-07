import { encodeJson, makeTestDbLayer } from '@budgie-at/test-kit';
import {
    SYNC_RECORD_DEFINITIONS,
    SYNC_RECORD_MAX_BYTES,
    SYNC_RECORD_SCHEMA_VERSION,
    decodeSyncRecord,
    encodeSyncAggregate,
    joinSplitTransactions
} from '@budgie/cloud-sync';
import { Db, SyncRecordTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { getTableColumns } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { testDb } from '../../harness/scenario/test-db';

import {
    encodeAllRecords,
    hydratedSnapshot,
    loadSyncState,
    materializeRecords,
    prepareTarget,
    seedFullLedger,
    seedTransferRefundAndConsolidation,
    throughTransport
} from './record-mapping-harness';

const ENVELOPE_KEYS = ['encryptedFields', 'recordName', 'recordType', 'schemaVersion', 'zone'];
const LOCAL_ONLY_PROPERTIES = new Set([
    'titleSearch',
    'contactId',
    'token',
    'historyProgress',
    'titleEn',
    'titleTags',
    'tagsGeneratedAt',
    'needsEmbedding'
]);
const NATURAL_KEY_TABLES = new Set(['instruments', 'mcc_categories']);
const aggregateDefinitions = Object.values(SYNC_RECORD_DEFINITIONS).filter(
    ({ recordType }) => recordType !== SyncRecordTypeEnum.TRANSACTION_LEG
);

const seedEverything = Effect.gen(function* () {
    const fixture = yield* seedFullLedger(testDb);

    yield* seedTransferRefundAndConsolidation(testDb, fixture);

    return fixture;
});

const decodeSource = Effect.gen(function* () {
    const { records } = yield* encodeSource;
    const decoded = yield* Effect.forEach(throughTransport(records), record => decodeSyncRecord(record));

    return { records, decoded };
});

const encodeSource = Effect.gen(function* () {
    const state = yield* loadSyncState(testDb);
    const records = yield* encodeAllRecords(state);

    return { state, records };
});

const decodeJsonRows = Schema.decodeSync(Schema.fromJsonString(Schema.Array(Schema.Record(Schema.String, Schema.Unknown))));

const parseJsonRows = (value: unknown) => decodeJsonRows(String(value));

describe('cloud-sync/record-mapping', () => {
    it.layer(makeTestDbLayer(null))('into a fresh database', it => {
        it.effect('round-trips every record type into a database with different local ids', () =>
            Effect.gen(function* () {
                const targetDatabase = yield* Db;

                yield* seedEverything;
                yield* prepareTarget(targetDatabase);

                const { records, decoded } = yield* decodeSource;
                const { joined, unmatched } = joinSplitTransactions(decoded);
                const unresolved = yield* materializeRecords(targetDatabase, joined);
                const source = yield* hydratedSnapshot(testDb);
                const target = yield* hydratedSnapshot(targetDatabase);
                const emptySourceTables = Object.entries(source)
                    .filter(([, rows]) => rows.length === 0)
                    .map(([tableName]) => tableName);
                const sourceCash = yield* testDb.$client.unsafe<{ readonly id: number }>(`SELECT id FROM accounts WHERE title = 'Cash'`);
                const targetCash = yield* targetDatabase.$client.unsafe<{ readonly id: number }>(
                    `SELECT id FROM accounts WHERE title = 'Cash'`
                );
                const refundLinks = yield* targetDatabase.$client.unsafe<{ readonly total: number }>(
                    `SELECT COUNT(*) AS total FROM transaction_entries WHERE original_transaction_id IS NOT NULL`
                );
                const consolidated = yield* targetDatabase.$client.unsafe<{ readonly total: number }>(
                    `SELECT COUNT(*) AS total FROM transactions WHERE consolidation_parent_transaction_id IS NOT NULL`
                );

                expect(new Set(records.map(record => record.recordType))).toEqual(
                    new Set(aggregateDefinitions.map(({ recordType }) => recordType))
                );
                expect(unmatched).toEqual([]);
                expect(unresolved).toEqual([]);
                expect(emptySourceTables).toEqual([]);
                expect(targetCash[0].id).not.toBe(sourceCash[0].id);
                expect(refundLinks[0].total).toBeGreaterThan(0);
                expect(consolidated[0].total).toBeGreaterThan(1);
                expect(target).toEqual(source);
            })
        );

        it.effect('rebuilds transfers, refunds and consolidated transactions with the same entries', () =>
            Effect.gen(function* () {
                const targetDatabase = yield* Db;

                yield* seedEverything;
                yield* prepareTarget(targetDatabase);

                const { decoded } = yield* decodeSource;

                yield* materializeRecords(targetDatabase, joinSplitTransactions(decoded).joined);

                const entriesSql = `SELECT t.title AS title, t.type AS type, t.consolidation_type AS consolidation, a.title AS account, e.type AS entryType, e.amount AS amount, e.sequence AS sequence
                    FROM transaction_entries e
                    INNER JOIN transactions t ON t.id = e.transaction_id
                    INNER JOIN accounts a ON a.id = e.account_id
                    ORDER BY t.title, e.type, a.title, e.sequence, e.amount`;
                const sourceEntries = yield* testDb.$client.unsafe(entriesSql);
                const targetEntries = yield* targetDatabase.$client.unsafe(entriesSql);

                expect(sourceEntries.length).toBeGreaterThan(8);
                expect(targetEntries).toEqual(sourceEntries);
            })
        );
    });

    it.effect('keeps every payload field encrypted and only schemaVersion plain', () =>
        Effect.gen(function* () {
            yield* seedEverything;

            const { records } = yield* encodeSource;

            for (const record of records) {
                expect(Object.keys(record).sort()).toEqual(ENVELOPE_KEYS);
                expect(record.schemaVersion).toBe(SYNC_RECORD_SCHEMA_VERSION);

                for (const value of Object.values(record.encryptedFields)) {
                    expect(['string', 'number', 'boolean']).toContain(typeof value);
                }
            }
        })
    );

    it.effect('leaves local-only data and local ids out of every record', () =>
        Effect.gen(function* () {
            yield* seedEverything;

            const { records } = yield* encodeSource;
            const serialized = encodeJson(records);

            for (const leaked of ['secret-token', 'contact-1', 'cursor']) {
                expect(serialized).not.toContain(leaked);
            }

            for (const property of LOCAL_ONLY_PROPERTIES) {
                expect(serialized).not.toContain(`"${property}"`);
            }
        })
    );

    it.effect('references rows by sync id and seeded instruments and MCC codes by natural key', () =>
        Effect.gen(function* () {
            const fixture = yield* seedEverything;
            const { records } = yield* encodeSource;
            const walletSyncId = yield* testDb.$client.unsafe<{ readonly syncId: string }>(
                `SELECT sync_id AS syncId FROM accounts WHERE id = ${fixture.wallet.id}`
            );
            const cashRecord = records.find(
                record => record.recordType === SyncRecordTypeEnum.ACCOUNT && record.encryptedFields['title'] === 'Cash'
            );
            const expenseRecord = records.find(
                record => record.recordType === SyncRecordTypeEnum.TRANSACTION && record.encryptedFields['title'] === 'Cafe'
            );
            const debtRecord = records.find(record => record.recordType === SyncRecordTypeEnum.DEBT_EVENT);
            const entrySyncId = yield* testDb.$client.unsafe<{ readonly syncId: string }>(
                `SELECT e.sync_id AS syncId FROM debt_events d INNER JOIN transaction_entries e ON e.id = d.transaction_entry_id`
            );
            const [entry] = parseJsonRows(expenseRecord?.encryptedFields['entries']);

            expect(cashRecord?.encryptedFields['parentSyncId']).toBe(walletSyncId[0].syncId);
            expect(cashRecord?.encryptedFields['instrumentCode']).toBe(fixture.primaryInstrument.code);
            expect(entry['mccCategoryCode']).toBe(fixture.mccCategory.mcc);
            expect(typeof entry['accountSyncId']).toBe('string');
            expect(typeof entry['sequence']).toBe('number');
            expect(debtRecord?.encryptedFields['transactionEntrySyncId']).toBe(entrySyncId[0].syncId);
            expect(debtRecord?.encryptedFields['debtAccountSyncId']).toEqual(expect.any(String));
        })
    );

    it.effect('encodes the same rows to the same records', () =>
        Effect.gen(function* () {
            yield* seedEverything;

            const first = yield* encodeSource;
            const second = yield* encodeSource;

            expect(second.records).toEqual(first.records);
        })
    );

    it.effect('accounts for every column of every synced table', () =>
        Effect.sync(() => {
            const syncedTables = new Set(
                aggregateDefinitions.flatMap(definition => [
                    definition.parent.tableName,
                    ...definition.children.map(child => child.descriptor.tableName)
                ])
            );

            for (const definition of aggregateDefinitions) {
                const descriptors = [
                    { descriptor: definition.parent, isParent: true },
                    ...definition.children.map(child => ({ descriptor: child.descriptor, isParent: false }))
                ];

                for (const { descriptor, isParent } of descriptors) {
                    const covered = new Set(descriptor.columns.map(column => column.property));
                    const unaccounted = Object.entries(getTableColumns(descriptor.table))
                        .filter(
                            ([property, column]) =>
                                !covered.has(property) &&
                                !['id', 'syncZone'].includes(property) &&
                                !(isParent && property === 'syncId') &&
                                property !== descriptor.parentLink?.property &&
                                !LOCAL_ONLY_PROPERTIES.has(property) &&
                                !isDefined(column.generated)
                        )
                        .map(([property]) => `${descriptor.tableName}.${property}`);
                    const unknownTargets = descriptor.columns
                        .map(column => column.reference?.tableName)
                        .filter(isDefined)
                        .filter(tableName => !syncedTables.has(tableName) && !NATURAL_KEY_TABLES.has(tableName));

                    expect(unaccounted).toEqual([]);
                    expect(unknownTargets).toEqual([]);
                    expect(isParent || isDefined(descriptor.parentLink)).toBe(true);
                }
            }
        })
    );

    it.effect('rejects records with a newer, invalid or malformed schema as typed failures', () =>
        Effect.gen(function* () {
            yield* seedEverything;

            const { records } = yield* encodeSource;
            const tag = records.find(record => record.recordType === SyncRecordTypeEnum.TAG);

            if (!isDefined(tag)) {
                return yield* Effect.die('expected a tag record');
            }

            const newer = yield* decodeSyncRecord({ ...tag, schemaVersion: SYNC_RECORD_SCHEMA_VERSION + 1 }).pipe(Effect.flip);
            const zero = yield* decodeSyncRecord({ ...tag, schemaVersion: 0 }).pipe(Effect.flip);
            const fractional = yield* decodeSyncRecord({ ...tag, schemaVersion: 1.5 }).pipe(Effect.flip);
            const unknownType = yield* decodeSyncRecord({ ...tag, recordType: 'Spaceship' }).pipe(Effect.flip);
            const missingField = yield* decodeSyncRecord({ ...tag, encryptedFields: {} }).pipe(Effect.flip);
            const wrongType = yield* decodeSyncRecord({ ...tag, encryptedFields: { ...tag.encryptedFields, title: 5 } }).pipe(Effect.flip);
            const garbage = yield* decodeSyncRecord(null).pipe(Effect.flip);
            const newerUnknownType = yield* decodeSyncRecord({
                ...tag,
                recordType: 'Spaceship',
                schemaVersion: SYNC_RECORD_SCHEMA_VERSION + 1
            }).pipe(Effect.flip);

            expect(newer._tag).toBe('SyncSchemaVersionUnsupportedError');
            expect(zero._tag).toBe('SyncSchemaVersionUnsupportedError');
            expect(fractional._tag).toBe('SyncSchemaVersionUnsupportedError');
            expect(newerUnknownType._tag).toBe('SyncSchemaVersionUnsupportedError');
            expect(unknownType._tag).toBe('SyncRecordInvalidError');
            expect(missingField._tag).toBe('SyncRecordInvalidError');
            expect(wrongType._tag).toBe('SyncRecordInvalidError');
            expect(garbage._tag).toBe('SyncRecordInvalidError');

            return undefined;
        })
    );

    it.effect('fails with a typed error for a reference without a sync identity', () =>
        Effect.gen(function* () {
            yield* seedEverything;

            const state = yield* loadSyncState(testDb);
            const account = state.aggregates.find(aggregate => aggregate.recordType === SyncRecordTypeEnum.ACCOUNT);

            if (!isDefined(account)) {
                return yield* Effect.die('expected an account aggregate');
            }

            const error = yield* Effect.fromResult(encodeSyncAggregate(account, { ...state.resolver, findNaturalKey: () => null })).pipe(
                Effect.flip
            );

            expect(error._tag).toBe('SyncIdentityUnresolvedError');

            return undefined;
        })
    );

    it.effect('refuses transactions that cannot fit one CloudKit record', () =>
        Effect.gen(function* () {
            yield* seedEverything;

            const state = yield* loadSyncState(testDb);
            const transaction = state.aggregates.find(
                aggregate =>
                    aggregate.recordType === SyncRecordTypeEnum.TRANSACTION && (aggregate.children['transaction_entries'] ?? []).length > 0
            );

            if (!isDefined(transaction)) {
                return yield* Effect.die('expected a transaction aggregate');
            }

            const [entry] = transaction.children['transaction_entries'];
            const withEntries = (count: number) => ({
                ...transaction,
                children: {
                    ...transaction.children,
                    transaction_entries: Array.from({ length: count }, (_, index) => ({
                        ...entry,
                        syncId: `entry-${index}`,
                        sequence: index
                    }))
                }
            });
            const fits = yield* Effect.fromResult(encodeSyncAggregate(withEntries(100), state.resolver));
            const error = yield* Effect.fromResult(encodeSyncAggregate(withEntries(5000), state.resolver)).pipe(Effect.flip);

            expect(encodeJson(fits[0].encryptedFields).length).toBeLessThan(SYNC_RECORD_MAX_BYTES);
            expect(error._tag).toBe('SyncRecordTooLargeError');

            return undefined;
        })
    );
});
