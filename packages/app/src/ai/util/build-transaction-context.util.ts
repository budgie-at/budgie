import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

interface TransactionContextInterface {
    title: string | null;
    mccDescription: string | null;
    amount: number;
    comment: string | null;
}

export const buildTransactionContext = (data: TransactionContextInterface): string => {
    const parts: string[] = [];

    if (isNotEmptyString(data.title)) {
        parts.push(data.title);
    }

    if (isNotEmptyString(data.mccDescription)) {
        parts.push(data.mccDescription.toLowerCase());
    }

    if (isPositiveNumber(data.amount)) {
        parts.push(String(data.amount));
    }

    if (isNotEmptyString(data.comment)) {
        parts.push(data.comment);
    }

    return parts.join(' ');
};
