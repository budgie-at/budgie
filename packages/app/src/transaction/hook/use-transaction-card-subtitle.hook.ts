import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { TransactionCardSelector } from '../components/transaction-card/transaction-card.selector';
import { isUncategorizedTransaction } from '../utils/is-uncategorized-transaction.util';

import { useTransactionSubtitleSegments } from './use-transaction-subtitle-segments.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionCardSubtitle = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null) => {
    const { segments, feeLabel, accountTitle, categoryLabel, relationLabel } = useTransactionSubtitleSegments(transaction, accountId);

    const descriptionSegments = [...segments, feeLabel].filter(isDefined);
    const toDetailSegments = (labels: readonly string[]) =>
        [...labels.flatMap(label => label.split(' · ')), feeLabel, accountTitle].filter(isNotEmptyString);

    return {
        description: descriptionSegments.join(' · '),
        accessibilityLabel: descriptionSegments.join(', '),
        detailSegments: toDetailSegments(segments),
        promotableSegment: relationLabel,
        promotedDetailSegments: toDetailSegments(segments.slice(0, -1)),
        accountTitle,
        subtitleTestID: [
            isUncategorizedTransaction(transaction) ? TransactionCardSelector.UncategorizedBadge : null,
            isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
        ].find(isDefined)
    };
};
