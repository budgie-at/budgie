import { BankIntegrationRepository, SyncRecordRepository } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { CloudSyncDeviceRecordSchema } from '../constant/cloud-sync-device-record-schema.constant';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';
import { CloudSyncInstallId } from '../port/cloud-sync-install-id.port';

export class BankOwnershipService extends Context.Service<BankOwnershipService>()('@budgie/cloud-sync/BankOwnershipService', {
    make: Effect.gen(function* () {
        const getInstallId = yield* CloudSyncInstallId;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const syncRecordRepository = yield* SyncRecordRepository;
        const handoverAfterMilliseconds = Duration.toMillis(Duration.days(14));

        return {
            evaluate: Effect.fn('BankOwnershipService.evaluate')(function* () {
                const installId = yield* getInstallId;
                const now = yield* Clock.currentTimeMillis;
                const deviceRecords = yield* syncRecordRepository.findByRecordType(CLOUD_SYNC_RECORDS.deviceRecordType);
                const lastSyncedAtByInstall = new Map(
                    deviceRecords.flatMap(record =>
                        Option.match(Schema.decodeUnknownOption(CloudSyncDeviceRecordSchema)(record.payload), {
                            onNone: () => [],
                            onSome: ({ encryptedFields }): [string, number][] => [[encryptedFields.installId, encryptedFields.lastSyncedAt]]
                        })
                    )
                );

                const activeIntegrations = yield* bankIntegrationRepository.findActive;

                yield* Effect.forEach(
                    activeIntegrations,
                    integration => {
                        const owner = integration.ownerInstallId;
                        const ownerLastSeenAt = isDefined(owner)
                            ? (lastSyncedAtByInstall.get(owner) ?? integration.updatedAt.getTime())
                            : 0;
                        const isClaimable = !isDefined(owner) || (owner !== installId && now - ownerLastSeenAt > handoverAfterMilliseconds);

                        return isClaimable
                            ? Effect.asVoid(bankIntegrationRepository.updateById(integration.id, { ownerInstallId: installId }))
                            : Effect.void;
                    },
                    { discard: true }
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BankOwnershipService, BankOwnershipService.make).pipe(
        Layer.provide([BankIntegrationRepository.layer, SyncRecordRepository.layer])
    );
}
