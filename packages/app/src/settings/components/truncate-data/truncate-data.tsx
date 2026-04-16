import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { appResetService } from '../../../@generic/service/app-reset.service';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsCard } from '../settings-card/settings-card';

export const TruncateData = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleTruncate = async () => {
        const confirmed = await confirmAlert({
            title: t`Clear All Data`,
            message: t`Are you sure you want to delete all your data? This action cannot be undone.`,
            confirmText: t`Delete data`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        setIsLoading(true);
        try {
            await appResetService.clearAllDataAndRestart();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t`Failed to clear data`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard
            onPress={handleTruncate}
            title={t`Clear All Data`}
            description={t`Delete all transactions and settings`}
            icon={UserIconNameEnum.Trash2}
            variant="destructive"
            isLoading={isLoading}
            testID={SettingsPageSelector.ClearDataCard}
        />
    );
};
