import { isNotEmptyString } from '@rnw-community/shared';

interface TransactionContextInterface {
    title: string | null;
    mccDescription: string | null;
    comment: string | null;
}

export const buildTransactionContext = (data: TransactionContextInterface): string => {
    const parts: string[] = [];

    /* eslint-disable lingui/no-unlocalized-strings -- LLM prompt labels */
    if (isNotEmptyString(data.title)) {
        parts.push(`Transaction: ${data.title}`);
    }

    if (isNotEmptyString(data.mccDescription)) {
        parts.push(`Type: ${data.mccDescription}`);
    }

    if (isNotEmptyString(data.comment)) {
        parts.push(`Note: ${data.comment}`);
    }

    return parts.join(' | ');
    /* eslint-enable lingui/no-unlocalized-strings */
};
