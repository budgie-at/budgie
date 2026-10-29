import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionIcon } from '../../utils/get-transaction-icon.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardSubtitle } from '../transaction-card-subtitle/transaction-card-subtitle';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionCardContent = ({ transaction, accountId = null }: Props) => {
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);
    const iconVariant = isUncategorizedTransaction(transaction) ? 'secondary' : TRANSACTION_COLOR[getTransactionType(transaction)];

    return (
        <View className="flex-row items-center gap-x-xl">
            <CircleIcon size={36} iconSize={18} radius={18} border={false} icon={getTransactionIcon(transaction)} variant={iconVariant} />

            <View className="flex-1 min-w-0 gap-y-xxs">
                {isAdjustment ? (
                    <Text
                        className="text-primary text-[15px] font-semibold"
                        numberOfLines={1}
                        testID={TransactionCardSelector.AdjustmentBadge}
                    >
                        <Trans>Balance Adjustment</Trans>
                    </Text>
                ) : (
                    <Text className="text-primary text-[15px] font-semibold" numberOfLines={1} ellipsizeMode="tail">
                        {getTransactionDisplayTitle(transaction)}
                    </Text>
                )}

                <TransactionCardSubtitle transaction={transaction} accountId={accountId} />
            </View>

            <TransactionAmount transaction={transaction} accountId={accountId} />
        </View>
    );
};
