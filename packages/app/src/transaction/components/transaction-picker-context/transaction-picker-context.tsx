import { Text, View } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';

interface Props {
    readonly transactionId: number;
}

export const TransactionPickerContext = ({ transactionId }: Props) => {
    const { transaction } = useGetTransactionByIdQuery(transactionId);
    const protectAmount = useProtectedAmountLabel();

    if (!transaction) {
        return null;
    }

    return (
        <View className="gap-y-xs py-xl">
            <Text dynamicTypeRamp="title3" className="text-[20px] font-semibold tabular-nums text-primary">
                {formatTransactionInfoAmount(transaction, protectAmount)}
            </Text>
            <Text dynamicTypeRamp="caption1" className="text-[13px] text-secondary-foreground">
                {getTransactionDisplayTitle(transaction)}
            </Text>
        </View>
    );
};
