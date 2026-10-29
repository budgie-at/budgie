import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
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
    const { segments, trailingSegments, categoryLabel } = useTransactionSubtitleSegments(transaction, accountId);
    const [segmentsBoxWidth, setSegmentsBoxWidth] = useState(0);
    const [segmentsLineWidth, setSegmentsLineWidth] = useState(0);

    if (!isNotEmptyArray(segments) && !isNotEmptyArray(trailingSegments)) {
        return null;
    }

    const subtitleTestID = [
        isUncategorizedTransaction(transaction) ? TransactionCardSelector.UncategorizedBadge : null,
        isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
    ].find(isDefined);

    const hasSegments = isNotEmptyArray(segments);
    const trailingClassName = hasSegments ? 'shrink-0' : 'shrink';
    const trailingLabel = trailingSegments.join(' · ');
    const trailingText = hasSegments ? ` · ${trailingLabel}` : trailingLabel;
    const truncationSlack = isPositiveNumber(segmentsLineWidth) ? Math.max(segmentsBoxWidth - segmentsLineWidth, 0) : 0;
    const trailingStyle = { transform: [{ translateX: -truncationSlack }] };

    const handleSegmentsLayout = (event: LayoutChangeEvent) => void setSegmentsBoxWidth(event.nativeEvent.layout.width);
    const handleSegmentsTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) =>
        void setSegmentsLineWidth(event.nativeEvent.lines.at(0)?.width ?? 0);

    return (
        <View className="flex-row">
            {hasSegments ? (
                <Text
                    className="shrink text-[13px] text-secondary-foreground"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    {...(isNotEmptyArray(trailingSegments) && { onLayout: handleSegmentsLayout, onTextLayout: handleSegmentsTextLayout })}
                    {...(isDefined(subtitleTestID) && { testID: subtitleTestID })}
                >
                    {segments.join(' · ')}
                </Text>
            ) : null}
            {isNotEmptyArray(trailingSegments) ? (
                <Text className={cn(trailingClassName, 'text-[13px] text-secondary-foreground')} style={trailingStyle} numberOfLines={1}>
                    {trailingText}
                </Text>
            ) : null}
        </View>
    );
};
