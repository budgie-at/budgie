import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

import { BankProviderSectionHeaderSelector } from './bank-provider-section-header.selector';

interface Props {
    readonly provider: ExternalSourceEnum;
    readonly integrationId: number;
    readonly total: number;
}

export const BankProviderSectionHeader = ({ provider, integrationId, total }: Props) => {
    const { t } = useLingui();

    const titleDescriptor = BANK_PROVIDER_TITLE[provider];
    const title = isDefined(titleDescriptor) ? t(titleDescriptor) : provider;

    const handleOpenIntegrationSettings = () => void router.push(`/bank-integration/${integrationId}`);

    return (
        <AccountSectionHeaderFrame total={total}>
            <View className="flex-row items-center gap-sm">
                <BankLogo bankProvider={provider} size={20} />
                <Text className="text-xs uppercase text-secondary-foreground">{title}</Text>
                <HapticPressable
                    className="rounded-full active:bg-secondary-background"
                    onPress={handleOpenIntegrationSettings}
                    accessibilityRole="button"
                    accessibilityLabel={t`Bank integration settings`}
                    testID={BankProviderSectionHeaderSelector.SettingsButton(integrationId)}
                >
                    <Icon className="text-secondary-foreground" icon={UserIconNameEnum.Settings} size={16} />
                </HapticPressable>
            </View>
        </AccountSectionHeaderFrame>
    );
};
