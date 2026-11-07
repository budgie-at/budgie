import { CloudSyncInstallId } from '@budgie/cloud-sync';
import { BankSyncInstallId } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { InstallIdService } from '../../cloud-backup/service/install-id.service';

export const cloudSyncInstallIdLayer = Layer.mergeAll(
    Layer.effect(
        CloudSyncInstallId,
        Effect.map(InstallIdService, installIdService => installIdService.get)
    ),
    Layer.effect(
        BankSyncInstallId,
        Effect.map(InstallIdService, installIdService => installIdService.get)
    )
).pipe(Layer.provide(InstallIdService.layer));
