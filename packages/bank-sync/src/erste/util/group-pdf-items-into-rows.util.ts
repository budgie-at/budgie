import { isDefined } from '@rnw-community/shared';

import {
    ERSTE_LAYOUT_FOOTER_Y_THRESHOLD,
    ERSTE_LAYOUT_RIGHT_COLUMN_X_THRESHOLD,
    ERSTE_LAYOUT_Y_ROW_TOLERANCE
} from '../constant/erste.constant';

import type { PageRowInterface } from '../interface/page-row.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

class RowBucket {
    private readonly items: PdfTextItemInterface[] = [];

    constructor(
        readonly page: number,
        readonly y: number,
        seed: PdfTextItemInterface
    ) {
        this.items.push(seed);
    }

    accepts(item: PdfTextItemInterface): boolean {
        return this.page === item.page && Math.abs(this.y - item.y) <= ERSTE_LAYOUT_Y_ROW_TOLERANCE;
    }

    push(item: PdfTextItemInterface): void {
        this.items.push(item);
    }

    toPageRow(): PageRowInterface {
        const sorted = [...this.items].sort((left, right) => left.x - right.x);

        return {
            page: this.page,
            y: this.y,
            leftItems: sorted.filter(item => item.x < ERSTE_LAYOUT_RIGHT_COLUMN_X_THRESHOLD),
            rightItems: sorted.filter(item => item.x >= ERSTE_LAYOUT_RIGHT_COLUMN_X_THRESHOLD)
        };
    }
}

const compareItemsByPageThenRow = (left: PdfTextItemInterface, right: PdfTextItemInterface): number => {
    if (left.page !== right.page) {
        return left.page - right.page;
    }
    const yDiff = right.y - left.y;
    if (Math.abs(yDiff) > ERSTE_LAYOUT_Y_ROW_TOLERANCE) {
        return yDiff;
    }
    
return left.x - right.x;
};

export const groupPdfItemsIntoRows = (items: PdfTextItemInterface[]): PageRowInterface[] => {
    const sorted = items.filter(item => item.y >= ERSTE_LAYOUT_FOOTER_Y_THRESHOLD).sort(compareItemsByPageThenRow);
    const buckets: RowBucket[] = [];

    for (const item of sorted) {
        const last = buckets.at(-1);

        if (isDefined(last) && last.accepts(item)) {
            last.push(item);
        } else {
            buckets.push(new RowBucket(item.page, item.y, item));
        }
    }

    return buckets.map(bucket => bucket.toPageRow());
};
