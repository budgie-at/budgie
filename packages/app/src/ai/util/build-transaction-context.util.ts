import { isNotEmptyString } from '@rnw-community/shared';

/* eslint-disable lingui/no-unlocalized-strings -- LLM prompt labels */
export const buildTransactionContext = (
    title: string,
    mccDescription: string | null,
    comment: string,
    categoryName?: string | null
): string => {
    const parts: string[] = [];
    const hasTitle = isNotEmptyString(title);

    if (hasTitle) {
        parts.push(`Transaction: ${title}`);
    }

    if (isNotEmptyString(categoryName)) {
        parts.push(`Category: ${categoryName}`);
    }

    if (isNotEmptyString(mccDescription)) {
        parts.push(`Type: ${mccDescription}`);
    }

    if (isNotEmptyString(comment)) {
        const commentLabel = hasTitle ? 'Note' : 'Transaction';
        parts.push(`${commentLabel}: ${comment}`);
    }

    return parts.join(' | ');
};
/* eslint-enable lingui/no-unlocalized-strings */
