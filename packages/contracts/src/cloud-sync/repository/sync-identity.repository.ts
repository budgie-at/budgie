import { asc, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { SettingsEntityTable } from '../../settings/table/settings-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { PERSONAL_SYNC_ZONE } from '../constant/personal-sync-zone.constant';
import { SYNC_IDENTITY_TABLES } from '../constant/sync-identity-tables.constant';
import { deriveBankTransactionSyncId } from '../utils/derive-bank-transaction-sync-id.util';
import { deriveSeedSyncId } from '../utils/derive-seed-sync-id.util';
import { deriveSyncId } from '../utils/derive-sync-id.util';
import { generateSyncId } from '../utils/generate-sync-id.util';

import { SyncApplyStateRepository } from './sync-apply-state.repository';

import type { SyncIdentityBackfillRowInterface } from '../interface/sync-identity-backfill-row.interface';
import type { SyncIdentityTableInterface } from '../interface/sync-identity-table.interface';

export class SyncIdentityRepository extends Context.Service<SyncIdentityRepository>()('@budgie/contracts/SyncIdentityRepository', {
    make: Effect.gen(function* () {
        const syncApplyStateRepository = yield* SyncApplyStateRepository;
        const lineageNamespace = '9f50be40-d1dd-4475-b76d-ee8f8af22d85';
        const batchSize = 500;
        const emptyBankColumns = 'NULL AS bankSource, NULL AS bankAccountExternalId, NULL AS bankTransactionExternalId';

        const findLineageId = Effect.fn('SyncIdentityRepository.findLineageId')(function* () {
            const [settings] = yield* Db.query(db =>
                db
                    .select({ lineageId: SettingsEntityTable.lineageId })
                    .from(SettingsEntityTable)
                    .orderBy(asc(SettingsEntityTable.id))
                    .limit(1)
            );

            return settings?.lineageId ?? null;
        });

        const ensureLineageId = Effect.fn('SyncIdentityRepository.ensureLineageId')(function* () {
            const existingLineageId = yield* findLineageId();

            if (isDefined(existingLineageId)) {
                return existingLineageId;
            }

            const [origin] = yield* Db.query(db =>
                db
                    .select({
                        settingsCreatedAt: sql<number>`MIN(${SettingsEntityTable.createdAt})`,
                        firstAccountAt: sql<number | null>`(SELECT MIN(${AccountEntityTable.createdAt}) FROM ${AccountEntityTable})`,
                        firstTransactionAt: sql<
                            number | null
                        >`(SELECT MIN(${TransactionEntityTable.createdAt}) FROM ${TransactionEntityTable})`
                    })
                    .from(SettingsEntityTable)
            );
            const lineageId = isDefined(origin?.firstAccountAt)
                ? deriveSyncId(lineageNamespace, `${origin.settingsCreatedAt}:${origin.firstAccountAt}:${origin.firstTransactionAt}`)
                : generateSyncId();

            yield* Db.query(db => db.update(SettingsEntityTable).set({ lineageId }).where(isNull(SettingsEntityTable.lineageId)));

            return (yield* findLineageId()) ?? lineageId;
        });

        const findMissingRows = (table: SyncIdentityTableInterface) =>
            Db.query(db =>
                db.$client.unsafe<SyncIdentityBackfillRowInterface>(
                    `SELECT rowid AS rowid, ${table.keyExpression} AS rowKey, ${table.seedKeyExpression ?? 'NULL'} AS seedKey, ${table.bankColumnsExpression ?? emptyBankColumns}
                    FROM ${table.name}
                    WHERE sync_id IS NULL
                    ORDER BY rowid
                    LIMIT ${batchSize}`
                )
            );

        const findClaimedSyncIds = (table: SyncIdentityTableInterface, syncIds: readonly string[]) =>
            isEmptyArray(syncIds)
                ? Effect.succeed(new Set<string>())
                : Db.query(db =>
                      db.$client.unsafe<{ syncId: string }>(
                          `SELECT sync_id AS syncId FROM ${table.name} WHERE sync_zone = ? AND sync_id IN (${syncIds.map(() => '?').join(', ')})`,
                          [PERSONAL_SYNC_ZONE, ...syncIds]
                      )
                  ).pipe(Effect.map(rows => new Set(rows.map(row => row.syncId))));

        const toBankSyncId = (row: SyncIdentityBackfillRowInterface) =>
            isNotEmptyString(row.bankSource) &&
            isNotEmptyString(row.bankAccountExternalId) &&
            isNotEmptyString(row.bankTransactionExternalId)
                ? deriveBankTransactionSyncId(row.bankSource, row.bankAccountExternalId, row.bankTransactionExternalId)
                : null;

        const assignBatch = Effect.fnUntraced(function* (table: SyncIdentityTableInterface, lineageId: string) {
            const rows = yield* findMissingRows(table);

            if (isEmptyArray(rows)) {
                return false;
            }

            const claimedSyncIds = yield* findClaimedSyncIds(table, rows.map(toBankSyncId).filter(isDefined));
            const assignments = rows.map(row => {
                const bankSyncId = toBankSyncId(row);

                if (isDefined(row.seedKey)) {
                    return { rowid: row.rowid, syncId: deriveSeedSyncId(row.seedKey) };
                }

                if (isDefined(bankSyncId) && !claimedSyncIds.has(bankSyncId)) {
                    claimedSyncIds.add(bankSyncId);

                    return { rowid: row.rowid, syncId: bankSyncId };
                }

                return { rowid: row.rowid, syncId: deriveSyncId(lineageId, `${table.name}:${row.rowKey}`) };
            });

            yield* Db.transaction(
                Effect.gen(function* () {
                    yield* syncApplyStateRepository.setApplying(true);
                    yield* Db.mutation(
                        { type: 'update', tables: [table.name] },
                        Effect.forEach(
                            assignments,
                            ({ rowid, syncId }) =>
                                Db.query(db =>
                                    db.$client.unsafe(`UPDATE ${table.name} SET sync_id = ? WHERE rowid = ? AND sync_id IS NULL`, [
                                        syncId,
                                        rowid
                                    ])
                                ),
                            { discard: true }
                        )
                    );
                    yield* syncApplyStateRepository.setApplying(false);
                })
            );

            return true;
        });

        return {
            findLineageId,
            ensureLineageId,
            countMissing: Effect.fn('SyncIdentityRepository.countMissing')(function* () {
                const [row] = yield* Db.query(db =>
                    db.$client.unsafe<{ total: number }>(
                        `SELECT SUM(missing) AS total FROM (${SYNC_IDENTITY_TABLES.map(table => `SELECT COUNT(*) AS missing FROM ${table.name} WHERE sync_id IS NULL`).join(' UNION ALL ')})`
                    )
                );

                return row?.total ?? 0;
            }),
            backfill: Effect.fn('SyncIdentityRepository.backfill')(function* () {
                const lineageId = yield* ensureLineageId();

                yield* Effect.forEach(
                    SYNC_IDENTITY_TABLES,
                    table =>
                        assignBatch(table, lineageId).pipe(Effect.tap(YIELD_TO_UI), Effect.repeat({ while: hasMoreRows => hasMoreRows })),
                    { discard: true }
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(SyncIdentityRepository, SyncIdentityRepository.make).pipe(
        Layer.provide(SyncApplyStateRepository.layer)
    );
}
