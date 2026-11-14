import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { TransactionCardSelector } from '../components/transaction-card/transaction-card.selector';
import { isUncategorizedTransaction } from '../utils/is-uncategorized-transaction.util';

import { useTransactionSubtitleSegments } from './use-transaction-subtitle-segments.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionCardSubtitle = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null) => {
    const { segments, feeLabel, accountTitle, categoryLabel } = useTransactionSubtitleSegments(transaction, accountId);

    const descriptionSegments = [...segments, feeLabel].filter(isDefined);

    return {
        description: descriptionSegments.join(' · '),
        accessibilityLabel: descriptionSegments.join(', '),
        detailSegments: [...segments.flatMap(segment => segment.split(' · ')), feeLabel, accountTitle].filter(isNotEmptyString),
        accountTitle,
        subtitleTestID: [
            isUncategorizedTransaction(transaction) ? TransactionCardSelector.UncategorizedBadge : null,
            isDefined(categoryLabel) ? TransactionCardSelector.Category(categoryLabel) : null
        ].find(isDefined)
    };
};
