import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { SettingsCard } from '../settings-card/settings-card';

export const PinDisabledCard = () => {
    const { t } = useLingui();

    const handleCreatePin = () => void router.push(`/settings/pin?mode=${PinSetupModeEnum.CREATE}`);

    return (
        <SettingsCard
            onPress={handleCreatePin}
            title={t`App Lock`}
            description={t`Secure your app with PIN & Face ID`}
            left={<CircleIcon icon={ICONS.Lock} variant="ghost" size="1_5xl" border={false} />}
            right={
                <Text className="text-xs bg-secondary-corner text-primary font-semibold py-md px-xl rounded-3xl">
                    <Trans>Enable</Trans>
                </Text>
            }
        />
    );
};
