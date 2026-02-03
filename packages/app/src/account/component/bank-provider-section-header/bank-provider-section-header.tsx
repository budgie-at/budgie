import { BankProviderEnum } from '@budgie/bank-sync';
import { BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { useBankProviderTotalQuery } from '../../query/use-bank-provider-total.query';

interface Props {
    readonly provider: ExternalSourceEnum;
    readonly syncStatus: BankSyncStatusEnum;
}

const syncStatusVariants = cva('size-2 rounded-full', {
    variants: {
        status: {
            [BankSyncStatusEnum.SYNCING]: 'bg-amber-500 animate-pulse',
            [BankSyncStatusEnum.IDLE]: 'bg-green-500',
            [BankSyncStatusEnum.FAILED]: 'bg-destructive'
        }
    }
});

export const BankProviderSectionHeader = ({ provider, syncStatus }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument, decimalPlaces } = useSettingsContext();
    const showCents = useSetting('showCents');
    const formatDigits = useFormatDigits(showCents ? 0 : decimalPlaces);
    const total = useBankProviderTotalQuery(provider);

    const formattedTotal = formatDigits(total, defaultInstrument.symbol);
    const titleDescriptor = BANK_PROVIDER_TITLE[provider];
    const title = isDefined(titleDescriptor) ? t(titleDescriptor) : provider;

    return (
        <View className="bg-primary-reverse py-md -mx-5xl px-5xl flex-row justify-between items-center">
            <View className="flex-row items-center gap-sm">
                <BankLogo bankProvider={provider as unknown as BankProviderEnum} size={20} />
                <Text className="text-xs uppercase text-secondary-foreground">{title}</Text>
                <View className={syncStatusVariants({ status: syncStatus })} />
            </View>
            <Text className="text-xs text-secondary-foreground">{formattedTotal}</Text>
        </View>
    );
};
