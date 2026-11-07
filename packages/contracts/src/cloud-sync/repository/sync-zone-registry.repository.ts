import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { SyncZoneRegistryEntityTable } from '../table/sync-zone-registry-entity.table';

import type { SyncZoneRegistryCreateEntityInterface } from '../entity/sync-zone-registry-create-entity.interface';

export class SyncZoneRegistryRepository extends Context.Service<SyncZoneRegistryRepository>()(
    '@budgie/contracts/SyncZoneRegistryRepository',
    {
        make: Effect.succeed({
            findByLabel: (zoneLabel: string) => Db.query(db => db.query.SyncZoneRegistryEntityTable.findFirst({ where: { zoneLabel } })),
            findAll: Db.query(db => db.query.SyncZoneRegistryEntityTable.findMany({ orderBy: { id: 'asc' } })),
            upsert: (input: SyncZoneRegistryCreateEntityInterface) =>
                Db.query(db =>
                    db
                        .insert(SyncZoneRegistryEntityTable)
                        .values(input)
                        .onConflictDoUpdate({
                            target: SyncZoneRegistryEntityTable.zoneLabel,
                            set: {
                                zoneName: input.zoneName,
                                ownerName: input.ownerName,
                                databaseScope: input.databaseScope,
                                role: input.role,
                                shareRecordName: input.shareRecordName ?? null,
                                updatedAt: new Date()
                            }
                        })
                )
        })
    }
) {
    static readonly layer = Layer.effect(SyncZoneRegistryRepository, SyncZoneRegistryRepository.make);
}
