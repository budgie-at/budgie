import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { AppResetService } from '../../../@generic/service/app-reset.service';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useConfirmedSettingsAction } from '../../hook/use-confirmed-settings-action.hook';
import { SettingsCard } from '../settings-card/settings-card';

export const TruncateData = () => {
    const { t } = useLingui();
    const { isLoading, run } = useConfirmedSettingsAction(
        {
            title: t`Clear All Data`,
            message: t`Are you sure you want to delete all your data? This action cannot be undone.`,
            confirmText: t`Delete data`,
            cancelText: t`Cancel`,
            isDestructive: true
        },
        t`Could not clear data`
    );

    const handleTruncate = () => run(Effect.flatMap(AppResetService, appResetService => appResetService.clearAllDataAndRestart()));

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
