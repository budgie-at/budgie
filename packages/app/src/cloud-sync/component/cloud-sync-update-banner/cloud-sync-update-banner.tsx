import { CloudSyncStatusEnum } from '@budgie/cloud-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';
import { PRESENCE_ENTERING, PRESENCE_EXITING } from '../../../@generic/constant/presence-motion.constant';
import { cloudSyncStatusAtom } from '../../constant/cloud-sync-status-atom.constant';

export const CloudSyncUpdateBanner = () => {
    const isUpdateRequired = useAtomValue(cloudSyncStatusAtom, ({ status }) => status === CloudSyncStatusEnum.UPDATE_REQUIRED);

    if (!isUpdateRequired) {
        return null;
    }

    return (
        <Animated.View
            className="mx-3xl mb-md flex-row items-center gap-x-md rounded-xl bg-warning/10 p-md"
            accessibilityRole="alert"
            entering={PRESENCE_ENTERING}
            exiting={PRESENCE_EXITING}
        >
            <Icon icon={UserIconNameEnum.CloudAlert} size={18} className="text-warning-strong" />
            <Text className="text-warning-strong flex-1 text-[13px] leading-[18px]">
                <Trans>Update Budgie to keep syncing</Trans>
            </Text>
        </Animated.View>
    );
};
