import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { useBankProviderTotalQuery } from '../../query/use-bank-provider-total.query';

interface Props {
    readonly provider: ExternalSourceEnum;
}

export const BankProviderSectionHeader = ({ provider }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();
    const total = useBankProviderTotalQuery(provider);

    const formattedTotal = formatDigits(total, defaultInstrument.symbol);
    const titleDescriptor = BANK_PROVIDER_TITLE[provider];
    const title = isDefined(titleDescriptor) ? t(titleDescriptor) : provider;

    return (
        <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
            <View className="flex-row items-center gap-sm">
                <BankLogo bankProvider={provider} size={20} />
                <Text className="text-xs uppercase text-secondary-foreground">{title}</Text>
            </View>
            <Text className="text-xs text-secondary-foreground">{formattedTotal}</Text>
        </View>
    );
};
