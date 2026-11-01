import { isNotEmptyString } from '@rnw-community/shared';

import type { CategoryEntityInterface } from '@budgie/contracts';

export const getCategoryIconTerms = ({
    title,
    titleEn,
    titleTags
}: Pick<CategoryEntityInterface, 'title' | 'titleEn' | 'titleTags'>): string[] => [
    ...new Set([title, titleEn ?? '', ...(titleTags ?? '').split(',').slice(0, 8)].map(term => term.trim()).filter(isNotEmptyString))
];
