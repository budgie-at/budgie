import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { AppResetService } from '../../../@generic/service/app-reset.service';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsRowAccessoryKindEnum } from '../../enum/settings-row-accessory-kind.enum';
import { useConfirmedSettingsAction } from '../../hook/use-confirmed-settings-action.hook';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

export const TruncateData = () => {
    const { t } = useLingui();
    const { isLoading, run } = useConfirmedSettingsAction(
        {
            title: t`Delete all data?`,
            message: t`Are you sure you want to delete all your data? This action cannot be undone.`,
            confirmText: t`Delete all data`,
            cancelText: t`Cancel`,
            isDestructive: true
        },
        t`Could not delete data`
    );

    const handleTruncate = () => run(Effect.flatMap(AppResetService, appResetService => appResetService.clearAllDataAndRestart()));

    const handlePress = () => void handleTruncate();

    return (
        <SettingsRow
            {...(!isLoading && { onPress: handlePress })}
            title={t`Delete all data`}
            icon={UserIconNameEnum.Trash2}
            variant="destructive"
            right={<SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.ACTION} isLoading={isLoading} />}
            testID={SettingsPageSelector.ClearDataCard}
        />
    );
};
