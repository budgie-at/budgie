import { ERSTE_LAYOUT_Y_ROW_TOLERANCE } from '../constant/erste.constant';

import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

export const comparePdfItemsByPageThenRow = (left: PdfTextItemInterface, right: PdfTextItemInterface): number => {
    if (left.page !== right.page) {
        return left.page - right.page;
    }

    const yDiff = right.y - left.y;
    if (Math.abs(yDiff) > ERSTE_LAYOUT_Y_ROW_TOLERANCE) {
        return yDiff;
    }

    return left.x - right.x;
};
