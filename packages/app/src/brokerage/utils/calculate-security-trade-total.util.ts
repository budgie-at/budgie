import { isPositiveNumber } from '@rnw-community/shared';

import type { SecurityTradeFormValues } from '../constant/security-trade-form-schema.constant';

export const calculateSecurityTradeTotal = (
    { quantity, price, fee, total }: Pick<SecurityTradeFormValues, 'fee' | 'price' | 'quantity' | 'total'>,
    isBuy: boolean
): number => (isPositiveNumber(total) ? total : quantity * price + (isBuy ? fee : -fee));
