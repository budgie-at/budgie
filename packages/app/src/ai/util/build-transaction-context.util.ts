import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

export interface TransactionContextInterface {
    title: string | null;
    mccDescription: string | null;
    amount: number;
    comment: string | null;
}

export const buildTransactionContext = (data: TransactionContextInterface): string => {
    const parts: string[] = [];

    /* eslint-disable lingui/no-unlocalized-strings */
    if (isNotEmptyString(data.title)) {
        parts.push(`Transaction: ${data.title}`);
    }

    if (isNotEmptyString(data.mccDescription)) {
        parts.push(`Merchant type: ${data.mccDescription}`);
    }

    if (isPositiveNumber(data.amount)) {
        parts.push(`Amount: ${data.amount}`);
    }

    if (isNotEmptyString(data.comment)) {
        parts.push(`Note: ${data.comment}`);
    }
    /* eslint-enable lingui/no-unlocalized-strings */

    return parts.join('\n');
};
