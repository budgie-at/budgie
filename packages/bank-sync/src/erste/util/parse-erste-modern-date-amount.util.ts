import { isValid, parse } from 'date-fns';

import { parseErsteAmount } from './parse-erste-amount.util';

import type { ErsteModernDateAmountInputInterface } from '../interface/erste-modern-date-amount-input.interface';

export const parseErsteModernDateAmount = ({
    day,
    month,
    year,
    amount,
    isDebit
}: ErsteModernDateAmountInputInterface): { date: Date; amount: number; isCredit: boolean } => {
    const date = parse(`${day}.${month}.${year}`, 'dd.MM.yyyy', new Date());

    if (!isValid(date)) {
        throw new Error(`Invalid Erste transaction date: ${day}.${month}.${year}`);
    }

    date.setHours(12, 0, 0, 0);

    return {
        date,
        amount: parseErsteAmount(amount, isDebit),
        isCredit: !isDebit
    };
};
