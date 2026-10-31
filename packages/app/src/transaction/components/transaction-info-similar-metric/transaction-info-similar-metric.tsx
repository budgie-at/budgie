import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { Text, View } from 'react-native';

import { TRANSACTION_INFO_ROW_MAX_FONT_SCALE } from '../../constant/transaction-info-row-max-font-scale.constant';

interface Props {
    readonly label: string;
    readonly amount: string;
    readonly testID: string;
}

export const TransactionInfoSimilarMetric = ({ label, amount, testID }: Props) => (
    <View className="flex-1 self-stretch min-w-[120px] gap-y-xxs" collapsable={false} testID={testID}>
        <Text
            maxFontSizeMultiplier={TRANSACTION_INFO_ROW_MAX_FONT_SCALE}
            className="text-[13px] leading-[18px] text-transaction-detail-secondary"
        >
            {label}
        </Text>
        <AmountField fontSize={20} className="self-stretch">
            <AmountFieldText
                maxFontSizeMultiplier={TRANSACTION_INFO_ROW_MAX_FONT_SCALE}
                className="leading-[25px] text-primary font-semibold tabular-nums"
                selectable
            >
                {amount}
            </AmountFieldText>
        </AmountField>
    </View>
);
