import { isDefined, isPositiveNumber } from '@rnw-community/shared';

export const shouldShowTransferPillSeparator = (amountCode: string | null, isNewTransaction: boolean, feeAmount: number): boolean =>
    isDefined(amountCode) && (isNewTransaction || isPositiveNumber(feeAmount));
