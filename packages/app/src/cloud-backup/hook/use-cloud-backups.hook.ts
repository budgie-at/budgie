import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { CloudRestoreService } from '../service/cloud-restore.service';

import type { CloudBackupListingInterface } from '../interface/cloud-backup-listing.interface';

const EMPTY_LISTING: CloudBackupListingInterface = { groups: [], isUnreadable: false, hasFailed: false };

const cloudBackupListingAtom = appAtomRuntime.atom(
    Effect.flatMap(
        Effect.serviceOption(CloudRestoreService),
        Option.match({
            onNone: () => Effect.succeed(EMPTY_LISTING),
            onSome: cloudRestoreService =>
                cloudRestoreService.listBackups().pipe(
                    Effect.map((groups): CloudBackupListingInterface => ({ groups, isUnreadable: false, hasFailed: false })),
                    Effect.catchTags({
                        EncryptedDataResetError: () =>
                            Effect.succeed<CloudBackupListingInterface>({ groups: [], isUnreadable: true, hasFailed: false })
                    }),
                    Effect.orElseSucceed(() => ({ ...EMPTY_LISTING, hasFailed: true }))
                )
        })
    )
);

export const useCloudBackups = () => {
    const result = useAtomValue(cloudBackupListingAtom);
    const refresh = useAtomRefresh(cloudBackupListingAtom);
    const listing = AsyncResult.getOrElse(result, () => EMPTY_LISTING);

    return { ...listing, isLoading: AsyncResult.isInitial(result) || result.waiting, refresh };
};
