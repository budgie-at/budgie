import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { Text, View } from 'react-native';

interface Props {
    readonly label: string;
    readonly amount: string;
    readonly testID: string;
}

export const TransactionInfoSimilarMetric = ({ label, amount, testID }: Props) => (
    <View className="flex-1 self-stretch min-w-[120px] gap-y-xxs" collapsable={false} testID={testID}>
        <Text className="text-[13px] leading-[18px] text-transaction-detail-secondary">{label}</Text>
        <AmountField fontSize={20} className="self-stretch">
            <AmountFieldText className="leading-[25px] text-primary font-semibold tabular-nums" selectable>
                {amount}
            </AmountFieldText>
        </AmountField>
    </View>
);
