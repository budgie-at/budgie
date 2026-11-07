import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { ICloudErrorCode, ICloudModule } from '../../../modules/icloud';
import { NativeCallError } from '../../@generic/error/native-call.error';
import { BackupKeyUnavailableError } from '../error/backup-key-unavailable.error';
import { CloudAccountUnavailableError } from '../error/cloud-account-unavailable.error';
import { CloudNetworkUnavailableError } from '../error/cloud-network-unavailable.error';
import { CloudQuotaExceededError } from '../error/cloud-quota-exceeded.error';
import { EncryptedDataResetError } from '../error/encrypted-data-reset.error';

import type { CloudTransportErrorType } from '../type/cloud-transport-error.type';

export class CloudTransport extends Context.Service<CloudTransport>()('@budgie/app/CloudTransport', {
    make: Effect.gen(function* () {
        const icloud = yield* Effect.orDie(Effect.fromNullishOr(ICloudModule));
        const isNativeError = Schema.is(Schema.Struct({ code: Schema.Enum(ICloudErrorCode) }));

        const translatedErrors: Partial<Record<ICloudErrorCode, () => CloudTransportErrorType>> = {
            [ICloudErrorCode.ACCOUNT_UNAVAILABLE]: () => CloudAccountUnavailableError.make({}),
            [ICloudErrorCode.QUOTA_EXCEEDED]: () => CloudQuotaExceededError.make({}),
            [ICloudErrorCode.NETWORK_UNAVAILABLE]: () => CloudNetworkUnavailableError.make({}),
            [ICloudErrorCode.BACKUP_KEY_UNAVAILABLE]: () => BackupKeyUnavailableError.make({}),
            [ICloudErrorCode.ENCRYPTED_DATA_RESET]: () => EncryptedDataResetError.make({})
        };

        const translateError = (cause: unknown): Effect.Effect<never, CloudTransportErrorType> => {
            const code = isNativeError(cause) ? cause.code : ICloudErrorCode.UNKNOWN;
            const makeError = translatedErrors[code];

            return isDefined(makeError) ? Effect.fail(makeError()) : Effect.die(cause);
        };

        const call = <A>(run: () => Promise<A>) =>
            Effect.tryPromise({ try: run, catch: cause => NativeCallError.make({ cause }) }).pipe(
                Effect.catch(error => translateError(error.cause))
            );

        return {
            getAccountStatus: call(() => icloud.getAccountStatus()),
            saveBackup: (fileUri: string, fields: Record<string, string | number>, encryptedFields: Record<string, string>) =>
                call(() => icloud.saveBackup(fileUri, fields, encryptedFields)),
            listBackups: call(() => icloud.listBackups()),
            downloadBackup: (recordName: string) => call(() => icloud.downloadBackup(recordName)),
            deleteBackups: (recordNames: readonly string[]) => call(() => icloud.deleteBackups(recordNames))
        };
    })
}) {
    static readonly layer = Layer.effect(CloudTransport, CloudTransport.make);
}
