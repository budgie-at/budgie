import { parseErsteAmount } from './parse-erste-amount.util';

import type { ErsteModernDateAmountInputInterface } from '../interface/erste-modern-date-amount-input.interface';

export const parseErsteModernDateAmount = ({
    day,
    month,
    year,
    amount,
    isDebit
}: ErsteModernDateAmountInputInterface): { date: Date; amount: number; isCredit: boolean } => ({
    date: new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 12, 0, 0),
    amount: parseErsteAmount(amount, isDebit),
    isCredit: !isDebit
});
