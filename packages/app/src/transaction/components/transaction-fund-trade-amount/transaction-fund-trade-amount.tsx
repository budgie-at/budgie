import { convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly fundEntry: AggregatedTransactionEntryInterface;
    readonly moneyEntry: AggregatedTransactionEntryInterface;
    readonly quantitySign: string;
    readonly testID: string;
}

export const TransactionFundTradeAmount = ({ fundEntry, moneyEntry, quantitySign, testID }: Props) => {
    const formatFundQuantity = useFormatFundQuantity();

    return (
        <View className="shrink-0 items-end gap-y-xxs" testID={testID}>
            <MoneyText
                amount={convertFromMicroUnits(moneyEntry.amount)}
                instrumentSymbol={moneyEntry.account.instrument.symbol}
                variant={MoneyTextVariantEnum.BODY}
                tone="primary"
            />
            <Text className="text-[13px] text-secondary-foreground text-right tabular-nums">
                {`${quantitySign}${formatFundQuantity(convertFromMicroUnits(fundEntry.amount))}`}
            </Text>
        </View>
    );
};
