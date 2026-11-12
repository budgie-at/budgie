import { CloudSyncService } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { CloudSyncRowSelector } from '../cloud-sync-row/cloud-sync-row.selector';

export const CloudSyncRetryRow = () => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();

    const handlePress = () => {
        void run(
            Effect.flatMap(CloudSyncService, cloudSyncService => cloudSyncService.retry).pipe(
                toastOnFailure(t`Could not restart iCloud sync`)
            )
        );
    };

    return (
        <SettingsRow
            icon={UserIconNameEnum.RotateCcw}
            variant="ghost"
            title={t`Try again`}
            {...(!isLoading && { onPress: handlePress })}
            testID={CloudSyncRowSelector.Retry}
        />
    );
};
