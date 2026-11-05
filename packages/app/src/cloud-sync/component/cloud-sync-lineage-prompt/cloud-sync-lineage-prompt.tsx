import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useEffect, useEffectEvent } from 'react';
import { Alert } from 'react-native';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { cloudSyncStatusAtom } from '../../constant/cloud-sync-status-atom.constant';
import { CloudSyncLineageChoiceEnum } from '../../enum/cloud-sync-lineage-choice.enum';
import { CloudSyncStatusEnum } from '../../enum/cloud-sync-status.enum';
import { CloudSyncService } from '../../service/cloud-sync.service';

export const CloudSyncLineagePrompt = () => {
    const { t } = useLingui();
    const { run } = useSingleFlight();
    const isConflict = useAtomValue(cloudSyncStatusAtom, ({ status }) => status === CloudSyncStatusEnum.LINEAGE_CONFLICT);

    const showPrompt = useEffectEvent(() => {
        const resolve = (choice: CloudSyncLineageChoiceEnum) => () =>
            void run(
                Effect.flatMap(CloudSyncService, cloudSyncService => cloudSyncService.resolveLineageConflict(choice)).pipe(
                    toastOnFailure(t`Could not resolve the iCloud conflict`)
                )
            );

        Alert.alert(
            t`Different data on this iPhone and iCloud`,
            t`This iPhone and iCloud hold different Budgie data. Choose which one to continue with. A safety copy of this iPhone's data is kept either way.`,
            [
                { text: t`Use iCloud data`, onPress: resolve(CloudSyncLineageChoiceEnum.USE_ICLOUD_DATA) },
                { text: t`Keep this device's data`, onPress: resolve(CloudSyncLineageChoiceEnum.KEEP_THIS_DEVICE) }
            ],
            { cancelable: false }
        );
    });

    useEffect(() => {
        if (isConflict) {
            showPrompt();
        }
    }, [isConflict]);

    return null;
};
