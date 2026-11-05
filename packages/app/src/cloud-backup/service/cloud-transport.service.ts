import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { ICloudErrorCode, ICloudModule } from '../../../modules/icloud';
import { BackupKeyUnavailableError } from '../error/backup-key-unavailable.error';
import { CloudAccountUnavailableError } from '../error/cloud-account-unavailable.error';
import { CloudNetworkUnavailableError } from '../error/cloud-network-unavailable.error';
import { CloudQuotaExceededError } from '../error/cloud-quota-exceeded.error';
import { EncryptedDataResetError } from '../error/encrypted-data-reset.error';

export class CloudTransport extends Context.Service<CloudTransport>()('@budgie/app/CloudTransport', {
    make: Effect.gen(function* () {
        const icloud = yield* Effect.orDie(Effect.fromNullishOr(ICloudModule));
        const isNativeError = Schema.is(Schema.Struct({ code: Schema.String }));

        const translateError = (
            cause: unknown
        ): Effect.Effect<
            never,
            | CloudAccountUnavailableError
            | CloudQuotaExceededError
            | CloudNetworkUnavailableError
            | BackupKeyUnavailableError
            | EncryptedDataResetError
        > => {
            const code = isNativeError(cause) ? cause.code : ICloudErrorCode.UNKNOWN;

            switch (code) {
                case ICloudErrorCode.ACCOUNT_UNAVAILABLE:
                    return Effect.fail(new CloudAccountUnavailableError());
                case ICloudErrorCode.QUOTA_EXCEEDED:
                    return Effect.fail(new CloudQuotaExceededError());
                case ICloudErrorCode.NETWORK_UNAVAILABLE:
                    return Effect.fail(new CloudNetworkUnavailableError());
                case ICloudErrorCode.BACKUP_KEY_UNAVAILABLE:
                    return Effect.fail(new BackupKeyUnavailableError());
                case ICloudErrorCode.ENCRYPTED_DATA_RESET:
                    return Effect.fail(new EncryptedDataResetError());
                default:
                    return Effect.die(cause);
            }
        };

        const call = <A>(run: () => Promise<A>) =>
            Effect.tryPromise({ try: run, catch: cause => cause }).pipe(Effect.catch(translateError));

        return {
            getAccountStatus: () => call(() => icloud.getAccountStatus()),
            saveBackup: (fileUri: string, fields: Record<string, string | number>, encryptedFields: Record<string, string>) =>
                call(() => icloud.saveBackup(fileUri, fields, encryptedFields)),
            listBackups: () => call(() => icloud.listBackups()),
            downloadBackup: (recordName: string) => call(() => icloud.downloadBackup(recordName)),
            deleteBackups: (recordNames: readonly string[]) => call(() => icloud.deleteBackups(recordNames))
        };
    })
}) {
    static readonly layer = Layer.effect(CloudTransport, CloudTransport.make);
}
