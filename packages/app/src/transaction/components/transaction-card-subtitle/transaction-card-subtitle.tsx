import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { useTransactionSubtitleSegments } from '../../hook/use-transaction-subtitle-segments.hook';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionCardSubtitle = ({ transaction, accountId }: Props) => {
    const { segments, trailingSegments, categoryLabel } = useTransactionSubtitleSegments(transaction, accountId);

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

    return (
        <View className="flex-row">
            {hasSegments ? (
                <Text
                    className="shrink text-[13px] text-secondary-foreground"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    {...(isDefined(subtitleTestID) && { testID: subtitleTestID })}
                >
                    {segments.join(' · ')}
                </Text>
            ) : null}
            {isNotEmptyArray(trailingSegments) ? (
                <Text className={cn(trailingClassName, 'text-[13px] text-secondary-foreground')} numberOfLines={1}>
                    {trailingText}
                </Text>
            ) : null}
        </View>
    );
};
