import { isPositiveNumber } from '@rnw-community/shared';

import { CATEGORIZE_INBOX_SECTION_CLASS_NAME, CATEGORIZE_INBOX_SECTION_ORDER } from '../constant/categorize-inbox-section-dot.constant';

import type { CategorizeInboxPileInterface } from '../interface/categorize-inbox-pile.interface';
import type { CategorizeInboxListItemType } from '@budgie/categorization';

export const getCategorizeInboxPile = (items: CategorizeInboxListItemType[], totalCount: number): CategorizeInboxPileInterface => {
    const headers = items.flatMap(item => ('rows' in item ? [] : [item]));
    const counts = CATEGORIZE_INBOX_SECTION_ORDER.map(section => ({
        section,
        count: headers.find(header => header.section === section)?.count ?? 0
    }));
    const shares = counts.map(({ count }) => (isPositiveNumber(totalCount) ? count / totalCount : 0));
    const segments = counts.map(({ section, count }, index) => ({
        section,
        count,
        className: CATEGORIZE_INBOX_SECTION_CLASS_NAME[section],
        share: shares[index]
    }));

    return { segments };
};
