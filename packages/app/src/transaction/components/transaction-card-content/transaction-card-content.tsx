import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ListRow } from '../../../@generic/component/list-row/list-row';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useTransactionCardSubtitle } from '../../hook/use-transaction-card-subtitle.hook';
import { useTransactionRowTitle } from '../../hook/use-transaction-row-title.hook';
import { isAccountBrokerageTrade } from '../../utils/is-account-brokerage-trade.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardIcon } from '../transaction-card-icon/transaction-card-icon';
import { TransactionCardStackedSubtitle } from '../transaction-card-stacked-subtitle/transaction-card-stacked-subtitle';
import { TransactionCardSubtitle } from '../transaction-card-subtitle/transaction-card-subtitle';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionCardContent = ({ transaction, accountId = null }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const displayTitle = useTransactionRowTitle(transaction);
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);
    const { t } = useLingui();
    const titleLineCount = isAccessibilityTextSize ? 0 : 1;
    const adjustmentTitle = isNotEmptyString(transaction.title) ? transaction.title : t`Balance Adjustment`;
    const { isDetailPromoted, title, subtitleSegments, stackedSegments, accountTitle, subtitleTestID } = useTransactionCardSubtitle(
        transaction,
        accountId,
        isAdjustment ? adjustmentTitle : displayTitle
    );

    const hasDetail =
        isAccessibilityTextSize ||
        isNotEmptyArray(subtitleSegments) ||
        isDefined(transaction.receipt) ||
        isAccountBrokerageTrade(transaction, accountId);

    const regularTitleNode = isNotEmptyString(title) ? (
        <Text
            className="text-primary text-[17px] font-semibold"
            numberOfLines={titleLineCount}
            ellipsizeMode="tail"
            {...(isDetailPromoted && isDefined(subtitleTestID) && { testID: subtitleTestID })}
        >
            {title}
        </Text>
    ) : null;
    const titleNode = isAdjustment ? (
        <Text
            className="text-primary text-[17px] font-semibold"
            numberOfLines={titleLineCount}
            testID={TransactionCardSelector.AdjustmentBadge}
        >
            {adjustmentTitle}
        </Text>
    ) : (
        regularTitleNode
    );
    const detail = isAccessibilityTextSize ? (
        <TransactionCardStackedSubtitle
            transaction={transaction}
            segments={stackedSegments}
            accountTitle={accountTitle}
            {...(!isDetailPromoted && isDefined(subtitleTestID) && { testID: subtitleTestID })}
        />
    ) : (
        <TransactionCardSubtitle
            transaction={transaction}
            accountId={accountId}
            segments={subtitleSegments}
            {...(!isDetailPromoted && isDefined(subtitleTestID) && { testID: subtitleTestID })}
        />
    );

    return (
        <ListRow
            leading={
                <View className={cn('justify-center', !hasDetail && 'min-h-[41px]')}>
                    <TransactionCardIcon transaction={transaction} />
                </View>
            }
            title={titleNode}
            trailing={<TransactionAmount transaction={transaction} accountId={accountId} />}
            {...(hasDetail && { detail })}
        />
    );
};
