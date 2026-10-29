import { CategorizeInboxSectionEnum } from '@budgie/categorization';

import { isPositiveNumber } from '@rnw-community/shared';

import type { CategorizeInboxPileInterface } from '../interface/categorize-inbox-pile.interface';
import type { CategorizeInboxClusterInterface, CategorizeInboxListItemType } from '@budgie/categorization';

export const getCategorizeInboxPile = (items: CategorizeInboxListItemType[], totalCount: number): CategorizeInboxPileInterface => {
    const headers = items.flatMap(item => ('rows' in item ? [] : [item]));
    const reviewClusters = items.flatMap(item => ('rows' in item && item.section === CategorizeInboxSectionEnum.REVIEW ? [item] : []));
    const countOf = (section: CategorizeInboxSectionEnum): number => headers.find(header => header.section === section)?.count ?? 0;

    const largestReview = reviewClusters.reduce<CategorizeInboxClusterInterface | null>(
        (largest, cluster) => (cluster.rows.length > (largest?.rows.length ?? 0) ? cluster : largest),
        null
    );
    const readyCount = countOf(CategorizeInboxSectionEnum.CONFIDENT);
    const largestCount = largestReview?.rows.length ?? 0;
    const counts = [
        { className: 'bg-positive-fill', rowCount: readyCount },
        { className: 'bg-primary', rowCount: largestCount },
        {
            className: 'bg-secondary-foreground',
            rowCount: countOf(CategorizeInboxSectionEnum.REVIEW) - largestCount + countOf(CategorizeInboxSectionEnum.CASH_WITHDRAWALS)
        },
        { className: 'bg-secondary-foreground opacity-50', rowCount: countOf(CategorizeInboxSectionEnum.ONE_OFFS) }
    ];
    const shares = counts.map(({ rowCount }) => (isPositiveNumber(totalCount) ? rowCount / totalCount : 0));
    const segments = counts.map(({ className }, index) => ({
        className,
        share: shares[index],
        offset: shares.slice(0, index).reduce((sum, share) => sum + share, 0)
    }));

    return { segments, readyCount, largestReview };
};
