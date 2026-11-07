import { and, eq, getTableColumns } from 'drizzle-orm';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyString, isNumber } from '@rnw-community/shared';

import { Db } from '../../../@generic/service/db.service';
import { stringifySyncJson } from '../../apply/utils/stringify-sync-json.util';
import { PERSONAL_SYNC_ZONE } from '../../constant/personal-sync-zone.constant';
import { SyncOutboxOperationEnum } from '../../enum/sync-outbox-operation.enum';
import { SYNC_NATURAL_KEY_PROPERTIES } from '../../mapping/constant/sync-natural-key-properties.constant';
import { SYNC_RECORD_DEFINITIONS } from '../../mapping/constant/sync-record-definitions.constant';
import { SyncRecordTypeEnum } from '../../mapping/enum/sync-record-type.enum';
import { SyncReferenceKindEnum } from '../../mapping/enum/sync-reference-kind.enum';
import { encodeSyncAggregate } from '../../mapping/utils/encode-sync-aggregate.util';
import { SyncOutboxRepository } from '../../repository/sync-outbox.repository';
import { SyncRecordRepository } from '../../repository/sync-record.repository';
import { SyncZoneRegistryRepository } from '../../repository/sync-zone-registry.repository';
import { SYNC_MOVED_FROM_MARKER_PREFIX, SYNC_MOVED_TO_MARKER_PREFIX } from '../../share/constant/sync-move-markers.constant';
import { readSyncMoveMarker } from '../../share/utils/read-sync-move-marker.util';
import { withSyncRecordFields } from '../../share/utils/with-sync-record-fields.util';
import { SyncRecordEntityTable } from '../../table/sync-record-entity.table';
import { isSyncAggregateRecordType } from '../type-guard/is-sync-aggregate-record-type.type-guard';

import type { SyncOutboxEntityInterface } from '../../entity/sync-outbox-entity.interface';
import type { SyncIdentityInterface } from '../../mapping/interface/sync-identity.interface';
import type { SyncRecordDefinitionInterface } from '../../mapping/interface/sync-record-definition.interface';
import type { SyncRecordInterface } from '../../mapping/interface/sync-record.interface';
import type { SyncReferenceResolverInterface } from '../../mapping/interface/sync-reference-resolver.interface';
import type { SyncAggregateRecordType } from '../../mapping/type/sync-aggregate-record-type.type';
import type { SyncRowInputType } from '../../mapping/type/sync-row-input.type';
import type { SyncRecordTargetInterface } from '../interface/sync-record-target.interface';
import type { SyncReferenceIdentityRowInterface } from '../interface/sync-reference-identity-row.interface';
import type { SyncUploadAcknowledgementInterface } from '../interface/sync-upload-acknowledgement.interface';
import type { SyncUploadBatchInterface } from '../interface/sync-upload-batch.interface';
import type { SyncUploadDeletionInterface } from '../interface/sync-upload-deletion.interface';
import type { SyncUploadRejectionInterface } from '../interface/sync-upload-rejection.interface';
import type { SyncUploadSaveInterface } from '../interface/sync-upload-save.interface';

const TRANSACTION_RECORD_TYPE: string = SyncRecordTypeEnum.TRANSACTION;
const SPLIT_FIELDS: ReadonlySet<string> = new Set(['linkId', 'legCount', 'legEntryPrivate']);

export class SyncUploadService extends Context.Service<SyncUploadService>()('@budgie/contracts/SyncUploadService', {
    make: Effect.gen(function* () {
        const syncOutboxRepository = yield* SyncOutboxRepository;
        const syncRecordRepository = yield* SyncRecordRepository;
        const zoneRegistryRepository = yield* SyncZoneRegistryRepository;
        const changedColumnsSchema = Schema.String.pipe(Schema.Array, Schema.fromJsonString);
        const linkedRecordSchema = Schema.fromJsonString(Schema.Struct({ encryptedFields: Schema.Struct({ linkId: Schema.String }) }));

        const parseChangedColumns = (changedColumns: string): readonly string[] =>
            Option.getOrElse(Schema.decodeOption(changedColumnsSchema)(changedColumns), () => []);

        const mapChangedFields = (definition: SyncRecordDefinitionInterface, changedColumns: readonly string[]): readonly string[] => {
            const parentColumns = getTableColumns(definition.parent.table);
            const parentFields = definition.parent.columns
                .filter(column => changedColumns.includes(parentColumns[column.property].name))
                .map(column => column.field);
            const childFields = definition.children
                .filter(child => changedColumns.includes(child.descriptor.tableName))
                .map(child => child.field);

            return [...new Set([...parentFields, ...childFields])].sort();
        };

        const loadChildren = Effect.fnUntraced(function* (definition: SyncRecordDefinitionInterface, parentId: number) {
            const entries = yield* Effect.forEach(definition.children, ({ descriptor }) => {
                const linkColumn = getTableColumns(descriptor.table)[descriptor.parentLink?.property ?? ''];

                return Db.query(db => db.select().from(descriptor.table).where(eq(linkColumn, parentId))).pipe(
                    Effect.map((rows): readonly [string, readonly SyncRowInputType[]] => [descriptor.tableName, rows])
                );
            });

            return Object.fromEntries(entries);
        });

        const findReferenceIdentities = (tableName: string, kind: SyncReferenceKindEnum, ids: readonly number[]) => {
            const naturalKeyColumn = SYNC_NATURAL_KEY_PROPERTIES[tableName];
            const columns =
                kind === SyncReferenceKindEnum.NATURAL_KEY
                    ? `id, NULL AS syncId, NULL AS syncZone, ${naturalKeyColumn} AS naturalKey`
                    : 'id, sync_id AS syncId, sync_zone AS syncZone, NULL AS naturalKey';

            return Db.query(db =>
                db.$client.unsafe<SyncReferenceIdentityRowInterface>(
                    `SELECT ${columns} FROM ${tableName} WHERE id IN (${ids.map(() => '?').join(', ')})`,
                    [...ids]
                )
            );
        };

        const buildResolver = Effect.fnUntraced(function* (
            definition: SyncRecordDefinitionInterface,
            parent: SyncRowInputType,
            children: Readonly<Record<string, readonly SyncRowInputType[]>>
        ) {
            const wanted = new Map<string, { readonly kind: SyncReferenceKindEnum; readonly ids: Set<number> }>();
            const descriptors = [
                { descriptor: definition.parent, rows: [parent] },
                ...definition.children.map(({ descriptor }) => ({ descriptor, rows: children[descriptor.tableName] ?? [] }))
            ];

            for (const { descriptor, rows } of descriptors) {
                for (const column of descriptor.columns) {
                    const { reference } = column;

                    if (isDefined(reference)) {
                        const entry = wanted.get(reference.tableName) ?? { kind: reference.kind, ids: new Set<number>() };

                        for (const value of rows.map(row => row[column.property]).filter(isNumber)) {
                            entry.ids.add(value);
                        }

                        wanted.set(reference.tableName, entry);
                    }
                }
            }

            const identities = new Map<string, Map<number, SyncIdentityInterface>>();
            const naturalKeys = new Map<string, Map<number, string>>();

            for (const [tableName, { kind, ids }] of wanted) {
                if (ids.size > 0) {
                    const rows = yield* findReferenceIdentities(tableName, kind, [...ids]);
                    const tableIdentities = new Map<number, SyncIdentityInterface>();
                    const tableNaturalKeys = new Map<number, string>();

                    for (const row of rows) {
                        if (isNotEmptyString(row.syncId) && isNotEmptyString(row.syncZone)) {
                            tableIdentities.set(row.id, { syncId: row.syncId, syncZone: row.syncZone });
                        }

                        if (isNotEmptyString(row.naturalKey)) {
                            tableNaturalKeys.set(row.id, row.naturalKey);
                        }
                    }

                    identities.set(tableName, tableIdentities);
                    naturalKeys.set(tableName, tableNaturalKeys);
                }
            }

            return {
                findSyncIdentity: (tableName, localId) => identities.get(tableName)?.get(localId) ?? null,
                findNaturalKey: (tableName, localId) => naturalKeys.get(tableName)?.get(localId) ?? null
            } satisfies SyncReferenceResolverInterface;
        });

        const rejected = (row: SyncOutboxEntityInterface, reason: string): SyncUploadRejectionInterface => ({
            syncZone: row.syncZone,
            syncId: row.syncId,
            syncRevision: row.syncRevision,
            reason
        });

        const findStaleLegTargets = Effect.fnUntraced(function* (records: readonly SyncRecordInterface[]) {
            const home = records.find(record => record.recordType === SyncRecordTypeEnum.TRANSACTION);

            if (!isDefined(home)) {
                return [];
            }

            const stored = yield* syncRecordRepository.find(home.zone, home.recordName);
            const linked = Option.flatMap(Option.fromNullishOr(stored?.payload), Schema.decodeOption(linkedRecordSchema));

            if (Option.isNone(linked)) {
                return [];
            }

            const currentLegZones = new Set(
                records.filter(record => record.recordType === SyncRecordTypeEnum.TRANSACTION_LEG).map(({ zone }) => zone)
            );
            const storedLegs = yield* Db.query(db =>
                db
                    .select({ syncZone: SyncRecordEntityTable.syncZone, syncId: SyncRecordEntityTable.syncId })
                    .from(SyncRecordEntityTable)
                    .where(
                        and(
                            eq(SyncRecordEntityTable.syncId, linked.value.encryptedFields.linkId),
                            eq(SyncRecordEntityTable.recordType, SyncRecordTypeEnum.TRANSACTION_LEG)
                        )
                    )
            );

            return storedLegs
                .filter(leg => !currentLegZones.has(leg.syncZone))
                .map((leg): SyncRecordTargetInterface => ({ recordName: leg.syncId, zone: leg.syncZone }));
        });

        const encodeRowRecords = Effect.fnUntraced(function* (recordType: SyncAggregateRecordType, syncZone: string, syncId: string) {
            const definition = SYNC_RECORD_DEFINITIONS[recordType];
            const parentColumns = getTableColumns(definition.parent.table);
            const parentRows: readonly SyncRowInputType[] = yield* Db.query(db =>
                db
                    .select()
                    .from(definition.parent.table)
                    .where(and(eq(parentColumns['syncZone'], syncZone), eq(parentColumns['syncId'], syncId)))
                    .limit(1)
            );
            const parent = parentRows.at(0);
            const parentId = parent?.['id'];

            if (!isDefined(parent) || !isNumber(parentId)) {
                return Result.fail(`Parent row missing for ${recordType}`);
            }

            const children = yield* loadChildren(definition, parentId);
            const resolver = yield* buildResolver(definition, parent, children);
            const encoded = encodeSyncAggregate({ recordType, parent, children }, resolver);

            return Result.isFailure(encoded)
                ? Result.fail(`${encoded.failure.name}: ${encoded.failure.message}`)
                : Result.succeed(encoded.success);
        });

        const annotateRecords = Effect.fnUntraced(function* (
            records: readonly SyncRecordInterface[],
            row: SyncOutboxEntityInterface,
            movedFrom: string | null
        ) {
            const legOwnerName = records.some(record => record.recordType === SyncRecordTypeEnum.TRANSACTION_LEG)
                ? ((yield* zoneRegistryRepository.findByLabel(PERSONAL_SYNC_ZONE))?.ownerName ?? null)
                : null;

            return records.map(record => {
                if (record.recordType === SyncRecordTypeEnum.TRANSACTION_LEG && isNotEmptyString(legOwnerName)) {
                    return withSyncRecordFields(record, record.zone, { privateOwnerName: legOwnerName });
                }

                return isNotEmptyString(movedFrom) && record.recordName === row.syncId && record.zone === row.syncZone
                    ? withSyncRecordFields(record, record.zone, { movedFrom })
                    : record;
            });
        });

        const buildSave = Effect.fnUntraced(function* (row: SyncOutboxEntityInterface) {
            if (!isSyncAggregateRecordType(row.recordType)) {
                return rejected(row, `Unknown record type ${row.recordType}`);
            }

            const encoded = yield* encodeRowRecords(row.recordType, row.syncZone, row.syncId);

            if (Result.isFailure(encoded)) {
                return rejected(row, encoded.failure);
            }

            const changedColumns = parseChangedColumns(row.changedColumns);
            const records = yield* annotateRecords(encoded.success, row, readSyncMoveMarker(changedColumns, SYNC_MOVED_FROM_MARKER_PREFIX));

            return {
                syncZone: row.syncZone,
                syncId: row.syncId,
                syncRevision: row.syncRevision,
                records,
                changedFields: mapChangedFields(SYNC_RECORD_DEFINITIONS[row.recordType], changedColumns),
                staleTargets: yield* findStaleLegTargets(records)
            } satisfies SyncUploadSaveInterface;
        });

        const buildTombstone = Effect.fnUntraced(function* (row: SyncOutboxEntityInterface, movedTo: string) {
            if (!isSyncAggregateRecordType(row.recordType)) {
                return null;
            }

            const encoded = yield* encodeRowRecords(row.recordType, movedTo, row.syncId);

            if (Result.isFailure(encoded)) {
                return null;
            }

            const target = encoded.success.find(record => record.recordName === row.syncId && record.zone === movedTo);

            if (!isDefined(target)) {
                return null;
            }

            const fields = Object.fromEntries(Object.entries(target.encryptedFields).filter(([field]) => !SPLIT_FIELDS.has(field)));
            const deletedAt = yield* Clock.currentTimeMillis;

            return {
                syncZone: row.syncZone,
                syncId: row.syncId,
                syncRevision: row.syncRevision,
                records: [withSyncRecordFields({ ...target, encryptedFields: fields }, row.syncZone, { deletedAt, movedTo })],
                changedFields: ['deletedAt', 'movedTo'],
                staleTargets: []
            } satisfies SyncUploadSaveInterface;
        });

        const buildDeletion = Effect.fnUntraced(function* (row: SyncOutboxEntityInterface) {
            const homeTarget: SyncRecordTargetInterface = { recordName: row.syncId, zone: row.syncZone };

            if (row.recordType !== TRANSACTION_RECORD_TYPE) {
                return { syncZone: row.syncZone, syncId: row.syncId, syncRevision: row.syncRevision, targets: [homeTarget] };
            }

            const stored = yield* syncRecordRepository.find(row.syncZone, row.syncId);
            const linked = Option.flatMap(Option.fromNullishOr(stored?.payload), Schema.decodeOption(linkedRecordSchema));
            const legs = Option.isSome(linked)
                ? yield* Db.query(db =>
                      db
                          .select({ syncZone: SyncRecordEntityTable.syncZone, syncId: SyncRecordEntityTable.syncId })
                          .from(SyncRecordEntityTable)
                          .where(eq(SyncRecordEntityTable.syncId, linked.value.encryptedFields.linkId))
                  )
                : [];

            return {
                syncZone: row.syncZone,
                syncId: row.syncId,
                syncRevision: row.syncRevision,
                targets: [homeTarget, ...legs.map(leg => ({ recordName: leg.syncId, zone: leg.syncZone }))]
            } satisfies SyncUploadDeletionInterface;
        });

        return {
            pending: Effect.fn('SyncUploadService.pending')(function* (limit: number) {
                const rows = yield* syncOutboxRepository.findPending(limit);
                const saves: SyncUploadSaveInterface[] = [];
                const deletions: SyncUploadDeletionInterface[] = [];
                const rejections: SyncUploadRejectionInterface[] = [];

                for (const row of rows) {
                    if (row.operation === SyncOutboxOperationEnum.DELETE) {
                        const movedTo = readSyncMoveMarker(parseChangedColumns(row.changedColumns), SYNC_MOVED_TO_MARKER_PREFIX);
                        const tombstone = isNotEmptyString(movedTo) ? yield* buildTombstone(row, movedTo) : null;

                        if (isDefined(tombstone)) {
                            saves.push(tombstone);
                        } else {
                            const deletion = yield* buildDeletion(row);

                            deletions.push(deletion);
                        }
                    } else {
                        const save = yield* buildSave(row);

                        if ('reason' in save) {
                            rejections.push(save);
                        } else {
                            saves.push(save);
                        }
                    }
                }

                return { saves, deletions, rejections } satisfies SyncUploadBatchInterface;
            }),
            acknowledge: Effect.fn('SyncUploadService.acknowledge')(function* (sent: readonly SyncUploadAcknowledgementInterface[]) {
                yield* Db.transaction(
                    Effect.forEach(
                        sent,
                        item =>
                            Effect.gen(function* () {
                                for (const { record, systemFields } of item.sentRecords) {
                                    const payload = yield* stringifySyncJson(record);

                                    yield* syncRecordRepository.upsert({
                                        syncZone: record.zone,
                                        syncId: record.recordName,
                                        recordType: record.recordType,
                                        systemFields,
                                        payload,
                                        schemaVersion: record.schemaVersion
                                    });
                                }

                                for (const target of item.deletedTargets) {
                                    yield* syncRecordRepository.remove(target.zone, target.recordName);
                                }

                                yield* syncOutboxRepository.acknowledge(item.syncZone, item.syncId, item.syncRevision);
                            }),
                        { discard: true }
                    )
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(SyncUploadService, SyncUploadService.make).pipe(
        Layer.provide([SyncOutboxRepository.layer, SyncRecordRepository.layer, SyncZoneRegistryRepository.layer])
    );
}
