import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { cloudSyncStatusAtom } from '../../constant/cloud-sync-status-atom.constant';
import { CloudSyncStatusEnum } from '../../enum/cloud-sync-status.enum';

export const CloudSyncUpdateBanner = () => {
    const isUpdateRequired = useAtomValue(cloudSyncStatusAtom, ({ status }) => status === CloudSyncStatusEnum.UPDATE_REQUIRED);

    if (!isUpdateRequired) {
        return null;
    }

    return (
        <View className="mx-3xl mb-md flex-row items-center gap-x-md rounded-xl bg-warning/10 p-md" accessibilityRole="alert">
            <Icon icon={UserIconNameEnum.CloudAlert} size={18} className="text-warning-foreground" />
            <Text className="text-warning-foreground flex-1 text-[13px] leading-[18px]">
                <Trans>Update Budgie to keep syncing</Trans>
            </Text>
        </View>
    );
};
