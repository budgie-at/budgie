import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { ICloudModule } from '../../../modules/icloud';
import { callNative } from '../../cloud-sync/utils/call-native.util';

import type { ICloudDownloadedBackup } from '../../../modules/icloud/interface/icloud-downloaded-backup.interface';
import type { CloudSyncTransportError } from '@budgie/cloud-sync';

export class CloudTransport extends Context.Service<CloudTransport>()('@budgie/app/CloudTransport', {
    make: Effect.gen(function* () {
        const icloud = yield* Effect.orDie(Effect.fromNullishOr(ICloudModule));

        return {
            getAccountStatus: callNative(() => icloud.getAccountStatus()),
            saveBackup: (fileUri: string, fields: Record<string, string | number>, encryptedFields: Record<string, string>) =>
                callNative(() => icloud.saveBackup(fileUri, fields, encryptedFields)),
            listBackups: callNative(() => icloud.listBackups()),
            downloadBackup: (recordName: string): Effect.Effect<ICloudDownloadedBackup, CloudSyncTransportError> =>
                callNative(() => icloud.downloadBackup(recordName)),
            deleteBackups: (recordNames: readonly string[]) => callNative(() => icloud.deleteBackups(recordNames))
        };
    })
}) {
    static readonly layer = Layer.effect(CloudTransport, CloudTransport.make);
}
