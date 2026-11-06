import { BankIntegrationRepository, BankSyncInstallId, SyncRecordRepository } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { CloudSyncDeviceRecordSchema } from '../constant/cloud-sync-device-record-schema.constant';
import { CLOUD_SYNC_RECORDS } from '../constant/cloud-sync-records.constant';

import { InstallIdService } from '../../cloud-backup/service/install-id.service';

export class BankOwnershipService extends Context.Service<BankOwnershipService>()('@budgie/app/BankOwnershipService', {
    make: Effect.gen(function* () {
        const installIdService = yield* InstallIdService;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const syncRecordRepository = yield* SyncRecordRepository;
        const handoverAfterMilliseconds = Duration.toMillis(Duration.days(14));

        return {
            evaluate: Effect.fn('BankOwnershipService.evaluate')(function* () {
                const installId = yield* installIdService.get;
                const now = yield* Clock.currentTimeMillis;
                const lastSyncedAtByInstall = new Map(
                    (yield* syncRecordRepository.findByRecordType(CLOUD_SYNC_RECORDS.deviceRecordType)).flatMap(record =>
                        Option.match(Schema.decodeUnknownOption(CloudSyncDeviceRecordSchema)(record.payload), {
                            onNone: () => [],
                            onSome: ({ encryptedFields }): [string, number][] => [[encryptedFields.installId, encryptedFields.lastSyncedAt]]
                        })
                    )
                );

                yield* Effect.forEach(
                    yield* bankIntegrationRepository.findActive,
                    integration => {
                        const owner = integration.ownerInstallId;
                        const ownerLastSeenAt = owner === null ? 0 : (lastSyncedAtByInstall.get(owner) ?? integration.updatedAt.getTime());
                        const isClaimable = owner === null || (owner !== installId && now - ownerLastSeenAt > handoverAfterMilliseconds);

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
        Layer.provide([InstallIdService.layer, BankIntegrationRepository.layer, SyncRecordRepository.layer])
    );
    static readonly installIdLayer = Layer.effect(
        BankSyncInstallId,
        Effect.map(InstallIdService, installIdService => installIdService.get)
    ).pipe(Layer.provide(InstallIdService.layer));
}
