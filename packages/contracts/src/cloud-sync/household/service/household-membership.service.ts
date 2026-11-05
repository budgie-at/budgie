import { sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../../@generic/service/db.service';
import { SyncAccountBalanceRefresher } from '../../apply/service/sync-account-balance-refresher.service';
import { HOUSEHOLD_SYNC_ZONE } from '../../constant/household-sync-zone.constant';
import { PERSONAL_SYNC_ZONE } from '../../constant/personal-sync-zone.constant';
import { RANDOM_SYNC_ID_SQL } from '../../constant/random-sync-id-sql.constant';
import { SYNC_IDENTITY_TABLES } from '../../constant/sync-identity-tables.constant';
import { SYNC_RECORD_DEFINITIONS } from '../../mapping/constant/sync-record-definitions.constant';
import { SyncRecordTypeEnum } from '../../mapping/enum/sync-record-type.enum';
import { SyncApplyStateRepository } from '../../repository/sync-apply-state.repository';
import { buildHouseholdRemovalStatements } from '../utils/build-household-removal-statements.util';

export class HouseholdMembershipService extends Context.Service<HouseholdMembershipService>()(
    '@budgie/contracts/HouseholdMembershipService',
    {
        make: Effect.gen(function* () {
            const applyStateRepository = yield* SyncApplyStateRepository;
            const balanceRefresher = yield* SyncAccountBalanceRefresher;
            const identityTableNames = SYNC_IDENTITY_TABLES.map(table => table.name);
            const touchedTables = [
                ...identityTableNames,
                'settings',
                'account_balances',
                'comment_embeddings',
                'merchant_embeddings',
                'default_category_translations',
                'sync_record',
                'sync_outbox',
                'sync_pending',
                'sync_zone_registry'
            ];
            const aggregateRoots = Object.values(SYNC_RECORD_DEFINITIONS)
                .filter(({ recordType }) => recordType !== SyncRecordTypeEnum.TRANSACTION_LEG)
                .map(({ recordType, parent }) => ({ recordType, tableName: parent.tableName }));

            const findHouseholdAccountIds = Db.query(db =>
                db.$client.unsafe<{ readonly id: number }>('SELECT id FROM accounts WHERE sync_zone = ?', [HOUSEHOLD_SYNC_ZONE])
            ).pipe(Effect.map(rows => rows.map(({ id }) => id)));

            const removeHouseholdRows = Db.mutation(
                { type: 'delete', tables: touchedTables },
                Effect.forEach(buildHouseholdRemovalStatements(''), statement => Db.query(db => db.$client.unsafe(statement)), {
                    discard: true
                })
            );

            const moveTableToPersonal = (tableName: string) =>
                Db.query(db =>
                    db.run(
                        sql`UPDATE OR IGNORE ${sql.raw(tableName)} SET sync_id = ${RANDOM_SYNC_ID_SQL}, sync_zone = ${PERSONAL_SYNC_ZONE} WHERE sync_zone = ${HOUSEHOLD_SYNC_ZONE}`
                    )
                );

            const enqueueUnrecordedPersonalRoots = Db.mutation(
                { type: 'insert', tables: ['sync_outbox'] },
                Effect.forEach(
                    aggregateRoots,
                    ({ recordType, tableName }) =>
                        Db.query(db =>
                            db.$client.unsafe(
                                `INSERT INTO sync_outbox (record_type, sync_zone, sync_id, operation, changed_columns)
                                SELECT ?, sync_zone, sync_id, 'SAVE', '[]' FROM ${tableName}
                                WHERE sync_id IS NOT NULL AND sync_zone = ?
                                AND NOT EXISTS (SELECT 1 FROM sync_record WHERE sync_record.sync_zone = ${tableName}.sync_zone AND sync_record.sync_id = ${tableName}.sync_id)
                                ON CONFLICT (sync_zone, sync_id) DO NOTHING`,
                                [recordType, PERSONAL_SYNC_ZONE]
                            )
                        ),
                    { discard: true }
                )
            );

            return {
                keepPersonalCopy: Effect.fn('HouseholdMembershipService.keepPersonalCopy')(function* () {
                    const movedAccountIds = yield* Db.transaction(
                        Effect.gen(function* () {
                            const accountIds = yield* findHouseholdAccountIds;

                            yield* applyStateRepository.setApplying(true);
                            yield* Db.mutation(
                                { type: 'update', tables: identityTableNames },
                                Effect.forEach(identityTableNames, moveTableToPersonal, { discard: true })
                            );
                            yield* removeHouseholdRows;
                            yield* applyStateRepository.setApplying(false);
                            yield* enqueueUnrecordedPersonalRoots;

                            return accountIds;
                        })
                    );

                    yield* balanceRefresher.refresh(movedAccountIds);
                }),
                dropHouseholdData: Effect.fn('HouseholdMembershipService.dropHouseholdData')(function* () {
                    yield* Db.transaction(
                        Effect.gen(function* () {
                            yield* applyStateRepository.setApplying(true);
                            yield* removeHouseholdRows;
                            yield* applyStateRepository.setApplying(false);
                        })
                    );
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(HouseholdMembershipService, HouseholdMembershipService.make).pipe(
        Layer.provide(SyncApplyStateRepository.layer)
    );
}
