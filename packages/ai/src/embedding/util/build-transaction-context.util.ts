import { isNotEmptyString } from '@rnw-community/shared';

import { EMBEDDING_CONTEXT_MAX_LENGTH } from '../../@generic/constant/embedding.constant';
import { TransactionContextNamesInterface } from '../interface/transaction-context-names.interface';

export const buildTransactionContext = (
    title: string,
    mccDescription: string | null,
    comment: string,
    names?: TransactionContextNamesInterface
): string => {
    const parts: string[] = [];
    const hasTitle = isNotEmptyString(title);

    if (hasTitle) {
        parts.push(`Transaction: ${title}`);
    }

    if (isNotEmptyString(names?.categoryName)) {
        parts.push(`Category: ${names.categoryName}`);
    }

    if (isNotEmptyString(names?.tagNames)) {
        parts.push(`Tags: ${names.tagNames}`);
    }

    if (isNotEmptyString(mccDescription)) {
        parts.push(`Type: ${mccDescription}`);
    }

    if (isNotEmptyString(comment)) {
        const commentLabel = hasTitle ? 'Note' : 'Transaction';
        parts.push(`${commentLabel}: ${comment}`);
    }

    const context = parts.join(' | ');

    return context.length > EMBEDDING_CONTEXT_MAX_LENGTH ? context.slice(0, EMBEDDING_CONTEXT_MAX_LENGTH) : context;
};
