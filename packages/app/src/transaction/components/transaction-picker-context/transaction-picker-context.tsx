import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';

interface Props {
    readonly transactionId: number;
    readonly label: string;
    readonly labelClassName?: string;
}

export const TransactionPickerContext = ({ transactionId, label, labelClassName }: Props) => {
    const { transaction } = useGetTransactionByIdQuery(transactionId);
    const protectAmount = useProtectedAmountLabel();

    if (!isDefined(transaction)) {
        return null;
    }

    return (
        <View className="gap-y-xs py-xl">
            <Text
                dynamicTypeRamp="footnote"
                accessibilityRole="header"
                className={cn('text-[13px] tabular-nums text-secondary-foreground', labelClassName)}
            >
                {label} · {formatTransactionInfoAmount(transaction, protectAmount)}
            </Text>
            <Text dynamicTypeRamp="caption1" className="text-[13px] font-semibold text-primary">
                {getTransactionDisplayTitle(transaction)}
            </Text>
        </View>
    );
};
