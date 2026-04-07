import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text } from 'react-native';

import { SettingsPageSelectors } from '../../../@e2e/selectors/settings-page.selector';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { SettingsCard } from '../settings-card/settings-card';

export const PinDisabledCard = () => {
    const { t } = useLingui();

    const handleCreatePin = () => void router.push(`/settings/pin?mode=${PinSetupModeEnum.CREATE}`);

    return (
        <SettingsCard
            onPress={handleCreatePin}
            title={t`App Lock`}
            icon={UserIconNameEnum.Lock}
            variant="ghost"
            testID={SettingsPageSelectors.AppLockCard}
            description={t`Secure your app with PIN & Face ID`}
            right={
                <Text className="text-xs bg-secondary-corner text-primary font-semibold py-md px-xl rounded-3xl">
                    <Trans>Enable</Trans>
                </Text>
            }
        />
    );
};
