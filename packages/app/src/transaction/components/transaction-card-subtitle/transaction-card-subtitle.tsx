import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useTransactionSubtitleSegments } from '../../hook/use-transaction-subtitle-segments.hook';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { LayoutChangeEvent, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionCardSubtitle = ({ transaction, accountId }: Props) => {
    const { t } = useLingui();
    const { segments, feeLabel, accountTitle, categoryLabel } = useTransactionSubtitleSegments(transaction, accountId);
    const [segmentsBoxWidth, setSegmentsBoxWidth] = useState(0);
    const [segmentsLineWidth, setSegmentsLineWidth] = useState(0);

    const hasSegments = isNotEmptyArray(segments);
    const hasReceipt = isDefined(transaction.receipt);
    const hasTrailing = isDefined(feeLabel) || isDefined(accountTitle);

    if (!hasSegments && !hasTrailing && !hasReceipt) {
        return null;
    }

    const subtitleTestID = [
        isUncategorizedTransaction(transaction) ? TransactionCardSelector.UncategorizedBadge : null,
        isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
    ].find(isDefined);

    const truncationSlack = isPositiveNumber(segmentsLineWidth) ? Math.max(segmentsBoxWidth - segmentsLineWidth, 0) : 0;
    const trailingStyle = { transform: [{ translateX: -truncationSlack }] };

    const handleSegmentsLayout = (event: LayoutChangeEvent) => void setSegmentsBoxWidth(event.nativeEvent.layout.width);
    const handleSegmentsTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) =>
        void setSegmentsLineWidth(event.nativeEvent.lines.at(0)?.width ?? 0);

    return (
        <View className="flex-row items-center">
            {hasReceipt ? (
                <View className="mr-xs" accessible accessibilityLabel={t`Receipt`} testID={TransactionCardSelector.ReceiptMarker}>
                    <Icon icon={UserIconNameEnum.Paperclip} size={12} className="text-secondary-foreground" />
                </View>
            ) : null}
            {hasSegments ? (
                <Text
                    className="shrink text-[13px] text-secondary-foreground"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    {...(hasTrailing && { onLayout: handleSegmentsLayout, onTextLayout: handleSegmentsTextLayout })}
                    {...(isDefined(subtitleTestID) && { testID: subtitleTestID })}
                >
                    {segments.join(' · ')}
                </Text>
            ) : null}
            {isDefined(feeLabel) ? (
                <Text className="shrink-0 text-[13px] text-secondary-foreground" style={trailingStyle} numberOfLines={1}>
                    {hasSegments ? ' · ' : null}
                    {feeLabel}
                </Text>
            ) : null}
            {isDefined(accountTitle) ? (
                <Text
                    className="min-w-[56px] shrink-100 text-[13px] text-secondary-foreground"
                    style={trailingStyle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {hasSegments || isDefined(feeLabel) ? ' · ' : null}
                    {accountTitle}
                </Text>
            ) : null}
        </View>
    );
};
