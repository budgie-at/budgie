import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ListRowDetail } from '../../../@generic/component/list-row-detail/list-row-detail';
import { isAccountBrokerageTrade } from '../../utils/is-account-brokerage-trade.util';
import { TransactionReceiptMarker } from '../transaction-receipt-marker/transaction-receipt-marker';
import { TransactionSecurityTradeDetail } from '../transaction-security-trade-detail/transaction-security-trade-detail';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
    readonly segments: readonly string[];
    readonly testID?: string;
}

export const TransactionCardSubtitle = ({ transaction, accountId, segments, testID }: Props) => {
    const hasReceipt = isDefined(transaction.receipt);
    if (isAccountBrokerageTrade(transaction, accountId)) {
        return <TransactionSecurityTradeDetail transaction={transaction} />;
    }

    if (!isNotEmptyArray(segments) && !hasReceipt) {
        return null;
    }

    return (
        <View className="flex-row items-start">
            {hasReceipt ? (
                <View className="mt-[3px] mr-xs">
                    <TransactionReceiptMarker transactionId={transaction.id} />
                </View>
            ) : null}
            <View className="min-w-0 flex-1">
                <ListRowDetail segments={segments} {...(isDefined(testID) && { testID })} />
            </View>
        </View>
    );
};
