import { ICloudErrorCode } from '@budgie/cloud-sync';
import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { CloudBackupListingStatusEnum } from '../enum/cloud-backup-listing-status.enum';
import { CloudRestoreService } from '../service/cloud-restore.service';

import type { CloudBackupListingInterface } from '../interface/cloud-backup-listing.interface';

const EMPTY_LISTING: CloudBackupListingInterface = { groups: [], status: CloudBackupListingStatusEnum.READY };

export const cloudBackupListing = Effect.flatMap(
    Effect.serviceOption(CloudRestoreService),
    Option.match({
        onNone: () => Effect.succeed(EMPTY_LISTING),
        onSome: cloudRestoreService =>
            cloudRestoreService.listBackups().pipe(
                Effect.map((groups): CloudBackupListingInterface => ({ groups, status: CloudBackupListingStatusEnum.READY })),
                Effect.catchTags({
                    CloudSyncTransportError: error => {
                        if (error.code === ICloudErrorCode.ACCOUNT_UNAVAILABLE) {
                            return Effect.succeed(EMPTY_LISTING);
                        }

                        return Effect.succeed<CloudBackupListingInterface>({
                            groups: [],
                            status:
                                error.code === ICloudErrorCode.ENCRYPTED_DATA_RESET
                                    ? CloudBackupListingStatusEnum.UNREADABLE
                                    : CloudBackupListingStatusEnum.FAILED
                        });
                    }
                })
            )
    })
);

const cloudBackupListingAtom = appAtomRuntime.atom(cloudBackupListing);

export const useCloudBackups = () => {
    const result = useAtomValue(cloudBackupListingAtom);
    const refresh = useAtomRefresh(cloudBackupListingAtom);
    const listing = AsyncResult.getOrElse(result, () => ({
        ...EMPTY_LISTING,
        status: AsyncResult.isFailure(result) ? CloudBackupListingStatusEnum.FAILED : CloudBackupListingStatusEnum.READY
    }));

    return { ...listing, isLoading: AsyncResult.isInitial(result) || result.waiting, refresh };
};
