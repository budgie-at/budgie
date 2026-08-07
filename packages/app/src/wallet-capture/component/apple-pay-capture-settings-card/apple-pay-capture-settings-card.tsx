import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { SettingsCard } from '../../../settings/components/settings-card/settings-card';

import { ApplePayCaptureSettingsCardSelector } from './apple-pay-capture-settings-card.selector';

interface Props {
    readonly testID?: string;
}

const IS_IOS = Platform.OS === 'ios';

const handleNavigate = () => void router.push('/settings/apple-pay-capture');

export const ApplePayCaptureSettingsCard = ({ testID = ApplePayCaptureSettingsCardSelector.Card }: Props) => {
    const { t } = useLingui();

    if (!IS_IOS) {
        return null;
    }

    return (
        <SettingsCard
            onPress={handleNavigate}
            title={t`Apple Pay capture`}
            description={t`Automatically record eligible card taps using Shortcuts`}
            icon={UserIconNameEnum.WalletCards}
            variant="positive"
            testID={testID}
        />
    );
};
