import { isNegativeAdjustmentTransaction, isPositiveAdjustmentTransaction } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
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

const SEGMENT_SEPARATOR = ' · ';

export const TransactionCardSubtitle = ({ transaction, accountId }: Props) => {
    const { segments, categoryLabel } = useTransactionSubtitleSegments(transaction, accountId);

    const isUncategorized = isUncategorizedTransaction(transaction);
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    if (isAdjustment || (!isUncategorized && !isNotEmptyArray(segments))) {
        return null;
    }

    const subtitleTestID = [
        isUncategorized ? TransactionCardSelector.UncategorizedBadge : null,
        isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
    ].find(isDefined);
    const uncategorizedSeparator = isUncategorized && isNotEmptyArray(segments) ? SEGMENT_SEPARATOR : '';

    return (
        <Text
            className="text-[13px] text-secondary-foreground"
            numberOfLines={1}
            ellipsizeMode="tail"
            {...(isDefined(subtitleTestID) && { testID: subtitleTestID })}
        >
            {isUncategorized ? (
                <Text className="font-medium text-warning-foreground">
                    <Trans>Uncategorized</Trans>
                </Text>
            ) : null}
            {uncategorizedSeparator}
            {segments.join(SEGMENT_SEPARATOR)}
        </Text>
    );
};
