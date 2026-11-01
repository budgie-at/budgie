import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { SettingsRow } from '../../../settings/components/settings-row/settings-row';

interface Props {
    readonly testID: string;
}

export const ApplePayCaptureSettingsCard = ({ testID }: Props) => {
    const { t } = useLingui();

    const handleNavigate = () => void router.push('/settings/apple-pay-capture');

    if (Platform.OS !== 'ios') {
        return null;
    }

    return (
        <SettingsRow
            onPress={handleNavigate}
            title={t`Apple Pay capture`}
            subtitle={t`Record card taps with Shortcuts`}
            icon={UserIconNameEnum.WalletCards}
            variant="ghost"
            testID={testID}
        />
    );
};
