import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useState } from 'react';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { AppResetService } from '../../../@generic/service/app-reset.service';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useRestoreBackup } from '../../../import/hook/use-restore-backup.hook';
import { ForgotPinRecoveryRow } from '../forgot-pin-recovery-row/forgot-pin-recovery-row';
import { ForgotPinSheetSelector } from '../forgot-pin-sheet/forgot-pin-sheet.selector';

export const ForgotPinRecoveryOptions = () => {
    const { t } = useLingui();
    const [isErasing, setIsErasing] = useState(false);
    const [, hapticImpact] = useVibration();

    const { selectAndRestore, isLoading: isRestoring } = useRestoreBackup();

    const handleErasePress = () => {
        appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const isConfirmed = yield* confirmAlert({
                        title: t`Erase and start fresh?`,
                        message: t`This deletes ${DB_NAME} and everything in it from this phone. It can't be undone.`,
                        confirmText: t`Erase`,
                        cancelText: t`Cancel`,
                        isDestructive: true
                    });

                    if (!isConfirmed) {
                        return;
                    }

                    hapticImpact(ImpactFeedbackStyle.Heavy);
                    setIsErasing(true);
                    const appResetService = yield* AppResetService;
                    yield* appResetService.clearAllDataAndRestart().pipe(
                        Effect.tapCause(() => Effect.sync(() => void setIsErasing(false))),
                        toastOnFailure(t`Could not erase the data`)
                    );
                })
            )
        );
    };

    const isBusy = isRestoring || isErasing;

    return (
        <GroupedListSection>
            <ForgotPinRecoveryRow
                testID={ForgotPinSheetSelector.RestoreRow}
                icon={UserIconNameEnum.Archive}
                variant="secondary"
                title={t`Restore a backup`}
                description={t`One you exported with a PIN you remember`}
                disabled={isBusy}
                onPress={selectAndRestore}
            />
            <ForgotPinRecoveryRow
                testID={ForgotPinSheetSelector.EraseRow}
                icon={UserIconNameEnum.Trash2}
                variant="destructive"
                title={t`Erase and start fresh`}
                description={t`Deletes ${DB_NAME} from this phone`}
                disabled={isBusy}
                onPress={handleErasePress}
            />
        </GroupedListSection>
    );
};
