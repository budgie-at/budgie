import { ERSTE_LAYOUT_RIGHT_COLUMN_X_THRESHOLD, ERSTE_LAYOUT_Y_ROW_TOLERANCE } from '../constant/erste.constant';

import type { PageRowInterface } from '../interface/page-row.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

export class RowBucket {
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
