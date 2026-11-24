import {
    TransactionConsolidationTypeEnum,
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ListRow } from '../../../@generic/component/list-row/list-row';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useTransactionCardSubtitle } from '../../hook/use-transaction-card-subtitle.hook';
import { useTransactionRowTitle } from '../../hook/use-transaction-row-title.hook';
import { isAccountBrokerageTrade } from '../../utils/is-account-brokerage-trade.util';
import { TransactionAmount } from '../transaction-amount/transaction-amount';
import { TransactionCardIcon } from '../transaction-card-icon/transaction-card-icon';
import { TransactionCardRefundedDetail } from '../transaction-card-refunded-detail/transaction-card-refunded-detail';
import { TransactionCardStackedSubtitle } from '../transaction-card-stacked-subtitle/transaction-card-stacked-subtitle';
import { TransactionCardSubtitle } from '../transaction-card-subtitle/transaction-card-subtitle';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionSecondaryAmount } from '../transaction-secondary-amount/transaction-secondary-amount';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionCardContent = ({ transaction, accountId = null }: Props) => {
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const displayTitle = useTransactionRowTitle(transaction);
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);
    const { t } = useLingui();
    const titleLineCount = isAccessibilityTextSize ? 3 : 1;
    const adjustmentTitle = isNotEmptyString(transaction.title) ? transaction.title : t`Balance Adjustment`;
    const { isDetailPromoted, title, subtitleSegments, stackedSegments, accountTitle, subtitleTestID } = useTransactionCardSubtitle(
        transaction,
        accountId,
        isAdjustment ? adjustmentTitle : displayTitle
    );

    const isRefund = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const hasDetail =
        isRefund ||
        isAccessibilityTextSize ||
        isNotEmptyArray(subtitleSegments) ||
        isDefined(transaction.receipt) ||
        isAccountBrokerageTrade(transaction, accountId);

    const regularTitleNode = isNotEmptyString(title) ? (
        <Text
            className="text-primary text-[17px] font-semibold"
            numberOfLines={titleLineCount}
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
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
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            testID={TransactionCardSelector.AdjustmentBadge}
        >
            {adjustmentTitle}
        </Text>
    ) : (
        regularTitleNode
    );
    const regularDetail = isAccessibilityTextSize ? (
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
    const detail = isRefund ? (
        <TransactionCardRefundedDetail
            transaction={transaction}
            accountId={accountId}
            subtitleSegments={subtitleSegments}
            stackedSegments={stackedSegments}
            accountTitle={accountTitle}
            {...(!isDetailPromoted && isDefined(subtitleTestID) && { testID: subtitleTestID })}
        />
    ) : (
        regularDetail
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
            trailingDetail={<TransactionSecondaryAmount transaction={transaction} accountId={accountId} />}
            {...(hasDetail && { detail })}
        />
    );
};
