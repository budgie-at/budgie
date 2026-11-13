import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ListRowDetail } from '../../../@generic/component/list-row-detail/list-row-detail';
import { useTransactionSubtitleSegments } from '../../hook/use-transaction-subtitle-segments.hook';
import { getSecurityTrade } from '../../utils/get-security-trade.util';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionReceiptMarker } from '../transaction-receipt-marker/transaction-receipt-marker';
import { TransactionSecurityTradeDetail } from '../transaction-security-trade-detail/transaction-security-trade-detail';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionCardSubtitle = ({ transaction, accountId }: Props) => {
    const { segments, feeLabel, accountTitle, categoryLabel } = useTransactionSubtitleSegments(transaction, accountId);

    const detailSegments = [...segments.flatMap(segment => segment.split(' · ')), feeLabel, accountTitle].filter(isNotEmptyString);
    const hasReceipt = isDefined(transaction.receipt);
    const trade = getSecurityTrade(transaction);
    const isBrokerageTrade = isDefined(trade) && (!isDefined(accountId) || accountId === trade.securityEntry.accountId);

    if (isBrokerageTrade) {
        return <TransactionSecurityTradeDetail transaction={transaction} />;
    }

    if (!isNotEmptyArray(detailSegments) && !hasReceipt) {
        return null;
    }

    const subtitleTestID = [
        isUncategorizedTransaction(transaction) ? TransactionCardSelector.UncategorizedBadge : null,
        isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
    ].find(isDefined);

    return (
        <View className="flex-row items-start">
            {hasReceipt ? (
                <View className="mt-[3px] mr-xs">
                    <TransactionReceiptMarker transactionId={transaction.id} />
                </View>
            ) : null}
            <View className="min-w-0 flex-1">
                <ListRowDetail segments={detailSegments} {...(isDefined(subtitleTestID) && { testID: subtitleTestID })} />
            </View>
        </View>
    );
};
