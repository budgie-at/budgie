import { ERSTE_AMOUNT_ONLY_REGEX, ERSTE_LAYOUT_Y_ROW_TOLERANCE } from '../constant/erste.constant';

import { parseErsteAmount } from './parse-erste-amount.util';

import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const ALTER_KONTOSTAND_LABEL = 'Alter Kontostand';

export const findOldBalance = (items: PdfTextItemInterface[]): number => {
    const labelItem = items.find(item => item.page === 1 && item.text === ALTER_KONTOSTAND_LABEL);

    if (!labelItem) {
        return 0;
    }

    const amountItem = items.find(
        item =>
            item.page === 1 &&
            Math.abs(item.y - labelItem.y) <= ERSTE_LAYOUT_Y_ROW_TOLERANCE &&
            item.x > labelItem.x &&
            ERSTE_AMOUNT_ONLY_REGEX.test(item.text)
    );

    if (!amountItem) {
        return 0;
    }

    const match = ERSTE_AMOUNT_ONLY_REGEX.exec(amountItem.text);

    return match ? parseErsteAmount(match[1], match[2] === '-') : 0;
};
