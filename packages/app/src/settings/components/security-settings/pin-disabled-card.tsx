import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';

export const PinDisabledCard = () => {
    const { t } = useLingui();

    const handleCreatePin = () => void router.push(`/settings/pin?mode=${PinSetupModeEnum.CREATE}`);
    const iconParams = { border: false, size: 40, iconSize: 20, variant: 'ghost' } as const;

    return (
        <SimpleHorizontalCell
            onPress={handleCreatePin}
            title={t`App Lock`}
            icon="Lock"
            iconParams={iconParams}
            description={t`Secure your app with PIN & Face ID`}
            right={
                <Text className="text-xs bg-secondary-corner text-primary font-semibold py-md px-xl rounded-3xl">
                    <Trans>Enable</Trans>
                </Text>
            }
        />
    );
};
