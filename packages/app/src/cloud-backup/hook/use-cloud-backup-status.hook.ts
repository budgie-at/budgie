import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { cloudBackupStatusAtom } from '../constant/cloud-backup-status-atom.constant';
import { CloudBackupStatusEnum } from '../enum/cloud-backup-status.enum';
import { CloudTransport } from '../service/cloud-transport.service';

import type { ICloudAccountStatus } from '../../../modules/icloud';

const ACCOUNT_BACKUP_STATUS: Record<ICloudAccountStatus, CloudBackupStatusEnum> = {
    available: CloudBackupStatusEnum.READY,
    couldNotDetermine: CloudBackupStatusEnum.NETWORK_UNAVAILABLE,
    noAccount: CloudBackupStatusEnum.ACCOUNT_UNAVAILABLE,
    restricted: CloudBackupStatusEnum.ACCOUNT_UNAVAILABLE,
    temporarilyUnavailable: CloudBackupStatusEnum.ACCOUNT_UNAVAILABLE
};

const cloudAccountStatusAtom = appAtomRuntime.atom(
    Effect.flatMap(
        Effect.serviceOption(CloudTransport),
        Option.match({
            onNone: () => Effect.succeed(CloudBackupStatusEnum.READY),
            onSome: cloudTransport =>
                cloudTransport.getAccountStatus().pipe(
                    Effect.map(({ status }) => ACCOUNT_BACKUP_STATUS[status]),
                    Effect.catchTag('CloudNetworkUnavailableError', () => Effect.succeed(CloudBackupStatusEnum.NETWORK_UNAVAILABLE)),
                    Effect.catch(() => Effect.succeed(CloudBackupStatusEnum.ACCOUNT_UNAVAILABLE))
                )
        })
    )
);

export const useCloudBackupStatus = () => {
    const accountResult = useAtomValue(cloudAccountStatusAtom);
    const backupStatus = useAtomValue(cloudBackupStatusAtom);
    const accountStatus = AsyncResult.getOrElse(accountResult, () => CloudBackupStatusEnum.READY);

    return {
        status: accountStatus === CloudBackupStatusEnum.READY ? backupStatus : accountStatus,
        isLoading: AsyncResult.isInitial(accountResult)
    };
};
