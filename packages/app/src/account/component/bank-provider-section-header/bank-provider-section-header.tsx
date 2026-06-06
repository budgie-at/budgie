import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

interface Props {
    readonly provider: ExternalSourceEnum;
    readonly total: number;
}

export const BankProviderSectionHeader = ({ provider, total }: Props) => {
    const { t } = useLingui();

    const titleDescriptor = BANK_PROVIDER_TITLE[provider];
    const title = isDefined(titleDescriptor) ? t(titleDescriptor) : provider;

    return (
        <AccountSectionHeaderFrame total={total}>
            <View className="flex-row items-center gap-sm">
                <BankLogo bankProvider={provider} size={20} />
                <Text className="text-xs uppercase text-secondary-foreground">{title}</Text>
            </View>
        </AccountSectionHeaderFrame>
    );
};
