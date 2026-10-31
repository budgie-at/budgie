import { Trans } from '@lingui/react/macro';
import Constants from 'expo-constants';
import { Text, View } from 'react-native';

import { BudgieLogo } from '../../../@generic/component/budgie-logo/budgie-logo';

export const SettingsAboutFooter = () => {
    const appVersion = Constants.expoConfig?.version ?? '1.0.0';

    return (
        <View className="items-center gap-y-xs pt-xl" accessible>
            <BudgieLogo size={28} />
            <Text className="text-secondary-foreground text-[15px]">
                <Trans>Budgie {appVersion}</Trans>
            </Text>
            <Text className="text-secondary-foreground px-5xl text-center text-[13px] leading-[18px]">
                <Trans>Private by design</Trans>
            </Text>
        </View>
    );
};
