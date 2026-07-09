import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly fromEntry: AggregatedTransactionEntryInterface;
    readonly toEntry: AggregatedTransactionEntryInterface;
    readonly testID: string;
}

export const TransactionTransferAmount = ({ fromEntry, toEntry, testID }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const fromAmount = formatDigits(convertFromMicroUnits(fromEntry.amount), fromEntry.account.instrument.symbol);
    const toAmount = formatDigits(convertFromMicroUnits(toEntry.amount), toEntry.account.instrument.symbol);

    return (
        <View className="gap-y-xxl items-end" testID={testID}>
            <Text className="text-sm font-semibold text-right text-default-foreground">{fromAmount}</Text>
            <View className="flex-row items-center gap-x-xs">
                <Icon icon={UserIconNameEnum.ArrowRight} className="text-secondary-foreground" size={12} />
                <Text className="text-secondary-foreground text-xxs">{toAmount}</Text>
            </View>
        </View>
    );
};
