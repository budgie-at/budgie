import { ICloudErrorCode } from '@budgie/cloud-sync';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useImportErrorHandlers } from '../../import/hook/use-import-error-handlers.hook';
import { cloudRestoreFailureAtom } from '../constant/cloud-restore-failure-atom.constant';
import { CloudRestoreFailureEnum } from '../enum/cloud-restore-failure.enum';
import { CloudRestoreService } from '../service/cloud-restore.service';

export const useRestoreCloudBackup = () => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const setFailures = useAtomSet(cloudRestoreFailureAtom);
    const importErrorHandlers = useImportErrorHandlers(t`Could not restore from iCloud`);

    const markFailure = (recordName: string, failure: CloudRestoreFailureEnum | null) =>
        Effect.sync(() => void setFailures(failures => ({ ...failures, [recordName]: failure })));

    const restore = (recordName: string) =>
        run(
            Effect.gen(function* () {
                const confirmed = yield* confirmAlert({
                    title: t`Restore from iCloud?`,
                    message: t`Restoring replaces all current Budgie data. A copy of your current data is kept for 7 days. The app restarts afterwards.`,
                    confirmText: t`Restore`,
                    cancelText: t`Cancel`,
                    isDestructive: true
                });

                if (!confirmed) {
                    return;
                }

                yield* markFailure(recordName, null);

                const cloudRestoreService = yield* Effect.serviceOption(CloudRestoreService);

                if (Option.isSome(cloudRestoreService)) {
                    yield* cloudRestoreService.value.restore(recordName);
                }
            }).pipe(
                Effect.catchTags({
                    ...importErrorHandlers,
                    CloudBackupUnreadableError: () => markFailure(recordName, CloudRestoreFailureEnum.UNREADABLE),
                    CloudSyncTransportError: error => {
                        if (error.code === ICloudErrorCode.BACKUP_KEY_UNAVAILABLE) {
                            return markFailure(recordName, CloudRestoreFailureEnum.KEYCHAIN_UNAVAILABLE);
                        }
                        if (error.code === ICloudErrorCode.ENCRYPTED_DATA_RESET) {
                            return markFailure(recordName, CloudRestoreFailureEnum.UNREADABLE);
                        }
                        if (error.code === ICloudErrorCode.NETWORK_UNAVAILABLE) {
                            return Effect.sync(() => void showErrorToast(t`Could not restore from iCloud`, t`Waiting for network`));
                        }
                        if (error.code === ICloudErrorCode.QUOTA_EXCEEDED) {
                            return Effect.sync(() => void showErrorToast(t`Could not restore from iCloud`, t`iCloud storage full`));
                        }

                        return Effect.sync(() => void showErrorToast(t`Could not restore from iCloud`, t`iCloud unavailable`));
                    }
                }),
                toastOnFailure(t`Could not restore from iCloud`)
            )
        );

    return { restore, isLoading };
};
