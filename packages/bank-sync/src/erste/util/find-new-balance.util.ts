import { ERSTE_AMOUNT_ONLY_REGEX } from '../constant/erste.constant';

import { parseErsteAmount } from './parse-erste-amount.util';

import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const NEW_BALANCE_INLINE_PREFIX = 'Neuer Kontostand';

export const findNewBalance = (items: PdfTextItemInterface[]): number => {
    const balanceItem = items.find(item => item.text.startsWith(NEW_BALANCE_INLINE_PREFIX));

    if (!balanceItem) {
        return 0;
    }

    const tail = balanceItem.text.slice(NEW_BALANCE_INLINE_PREFIX.length).trim();
    const match = ERSTE_AMOUNT_ONLY_REGEX.exec(tail);

    return match ? parseErsteAmount(match[1], match[2] === '-') : 0;
};
