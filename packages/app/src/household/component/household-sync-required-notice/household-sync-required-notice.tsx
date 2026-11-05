import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useSetting } from '../../../settings/hook/use-setting.hook';

export const HouseholdSyncRequiredNotice = () => {
    const isSyncEnabled = useSetting('cloudSyncEnabled');

    return isSyncEnabled ? null : (
        <Text className="text-warning-foreground px-3xl text-[13px] leading-[18px]">
            <Trans>Turn on "Sync across my devices" to share with family.</Trans>
        </Text>
    );
};
