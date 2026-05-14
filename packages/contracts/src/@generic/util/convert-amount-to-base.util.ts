import { isDefined } from '@rnw-community/shared';

export const convertAmountToBase = (
    amount: number,
    rate: number | null
): { readonly convertedAmount: number; readonly isFallback: boolean } => {
    if (!isDefined(rate)) {
        return { convertedAmount: amount, isFallback: true };
    }

    return { convertedAmount: Math.round(amount * rate), isFallback: false };
};
