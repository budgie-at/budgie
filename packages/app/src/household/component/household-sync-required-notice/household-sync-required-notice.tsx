import { useLingui } from '@lingui/react/macro';
import Animated from 'react-native-reanimated';

import { PRESENCE_ENTERING, PRESENCE_EXITING } from '../../../@generic/constant/presence-motion.constant';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { SettingsWarningSubtitle } from '../../../settings/components/settings-warning-subtitle/settings-warning-subtitle';
import { useSetting } from '../../../settings/hook/use-setting.hook';

export const HouseholdSyncRequiredNotice = () => {
    const { t } = useLingui();
    const isSyncEnabled = useSetting('cloudSyncEnabled');
    const { isAvailable } = useICloudAccount();

    if (!isAvailable || isSyncEnabled) {
        return null;
    }

    return (
        <Animated.View className="px-3xl" entering={PRESENCE_ENTERING} exiting={PRESENCE_EXITING}>
            <SettingsWarningSubtitle>{t`Turn on "Sync across devices" to share with family.`}</SettingsWarningSubtitle>
        </Animated.View>
    );
};
