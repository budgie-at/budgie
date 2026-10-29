import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useTransactionSubtitleSegments } from '../../hook/use-transaction-subtitle-segments.hook';
import { isUncategorizedTransaction } from '../../utils/is-uncategorized-transaction.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId: number | null;
}

export const TransactionCardSubtitle = ({ transaction, accountId }: Props) => {
    const { segments, categoryLabel } = useTransactionSubtitleSegments(transaction, accountId);

    if (!isNotEmptyArray(segments)) {
        return null;
    }

    const subtitleTestID = [
        isUncategorizedTransaction(transaction) ? TransactionCardSelector.UncategorizedBadge : null,
        isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
    ].find(isDefined);

    return (
        <Text
            className="text-[13px] text-secondary-foreground"
            numberOfLines={1}
            ellipsizeMode="tail"
            {...(isDefined(subtitleTestID) && { testID: subtitleTestID })}
        >
            {segments.join(' · ')}
        </Text>
    );
};
