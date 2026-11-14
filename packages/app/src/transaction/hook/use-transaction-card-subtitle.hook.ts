import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { TransactionCardSelector } from '../components/transaction-card/transaction-card.selector';
import { isUncategorizedTransaction } from '../utils/is-uncategorized-transaction.util';

import { useTransactionSubtitleSegments } from './use-transaction-subtitle-segments.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionCardSubtitle = (
    transaction: TransactionWithRelationsEntityInterface,
    accountId: number | null,
    title: string
) => {
    const { t } = useLingui();
    const {
        segments,
        feeLabel,
        accountTitle,
        categoryLabel,
        relationLabel,
        categoryTitles,
        counterpartySource: source,
        counterpartyDestination: destination
    } = useTransactionSubtitleSegments(transaction, accountId);

    const isCounterpartySplit =
        isNotEmptyString(source) && isNotEmptyString(destination) && relationLabel === t`From ${source} to ${destination}`;
    const promotedSegments = isDefined(relationLabel) ? [...segments.slice(0, -1), isCounterpartySplit ? t`From ${source}` : ''] : segments;
    const toDetailSegments = (labels: readonly string[]) =>
        [...labels.flatMap(label => label.split(' · ')), feeLabel, accountTitle].filter(isNotEmptyString);

    const promotableSegment = isCounterpartySplit
        ? t`To ${destination}`
        : (relationLabel ?? (isNotEmptyString(categoryTitles) ? categoryTitles : null));
    const isDetailPromoted = !isNotEmptyString(title) && isNotEmptyString(promotableSegment);

    return {
        isDetailPromoted,
        title: isDetailPromoted ? promotableSegment : title,
        subtitleSegments: toDetailSegments(isDetailPromoted ? promotedSegments : segments),
        stackedSegments: [...(isDetailPromoted ? promotedSegments : segments), feeLabel].filter(isNotEmptyString),
        accountTitle,
        subtitleTestID: [
            isUncategorizedTransaction(transaction) ? TransactionCardSelector.UncategorizedBadge : null,
            isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
        ].find(isDefined)
    };
};
