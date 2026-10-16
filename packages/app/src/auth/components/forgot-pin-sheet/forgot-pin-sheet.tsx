import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { AppResetService } from '../../../@generic/service/app-reset.service';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useRestoreBackup } from '../../../import/hook/use-restore-backup.hook';
import { OnboardingStepIntro } from '../../../onboarding/component/onboarding-step-intro/onboarding-step-intro';

import { ForgotPinSheetSelector } from './forgot-pin-sheet.selector';

export const ForgotPinSheet = () => {
    const { t } = useLingui();

    const [isErasing, setIsErasing] = useState(false);

    const { selectAndRestore, isLoading: isRestoring } = useRestoreBackup();

    const handleErasePress = async () => {
        const isConfirmed = await confirmAlert({
            title: t`Erase and start fresh?`,
            message: t`This deletes ${DB_NAME} and everything in it from this phone. It can't be undone.`,
            confirmText: t`Erase`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!isConfirmed) {
            return;
        }

        setIsErasing(true);
        appRuntime
            .runPromise(Effect.flatMap(AppResetService, appResetService => appResetService.clearAllDataAndRestart()))
            .catch((error: unknown) => {
                setIsErasing(false);
                showErrorToast(t`Could not erase the data`, getErrorMessage(error));
            });
    };

    const handleTryAgainPress = () => void router.back();

    const isBusy = isRestoring || isErasing;

    return (
        <View testID={ForgotPinSheetSelector.Root} className="bg-primary-reverse px-5xl pt-7xl pb-safe-or-[16px] gap-y-3xl">
            <OnboardingStepIntro
                icon={UserIconNameEnum.KeyRound}
                iconVariant="destructive"
                title={t`Budgie can't reset your PIN`}
                description={t`It's the only key to your file. There's no account and no copy on a server, so there's nothing to reset it from.`}
            />

            <View className="gap-y-md">
                <SimpleHorizontalCell
                    testID={ForgotPinSheetSelector.RestoreRow}
                    left={<CircleIcon icon={UserIconNameEnum.Archive} variant="secondary" size={36} iconSize={18} />}
                    title={t`Restore a backup`}
                    description={t`One you exported with a PIN you remember`}
                    disabled={isBusy}
                    onPress={selectAndRestore}
                />
                <SimpleHorizontalCell
                    testID={ForgotPinSheetSelector.EraseRow}
                    left={<CircleIcon icon={UserIconNameEnum.Trash2} variant="destructive" size={36} iconSize={18} />}
                    title={t`Erase and start fresh`}
                    description={t`Deletes ${DB_NAME} from this phone`}
                    disabled={isBusy}
                    onPress={handleErasePress}
                />
            </View>

            <Button testID={ForgotPinSheetSelector.TryAgainButton} variant="cta" content={t`Try again`} onPress={handleTryAgainPress} />

            <Text className="text-secondary-foreground text-xs text-center">
                <Trans>After 5 wrong tries, Budgie waits a little longer between attempts.</Trans>
            </Text>
        </View>
    );
};
