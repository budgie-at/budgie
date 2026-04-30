import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { ERSTE_LAYOUT_FOOTER_Y_THRESHOLD, ERSTE_LAYOUT_Y_ROW_TOLERANCE } from '../constant/erste.constant';

import { ErsteRowBucket } from './erste-row-bucket';

import type { ErstePageRowInterface } from '../interface/erste-page-row.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const compareByPageThenRow = (left: PdfTextItemInterface, right: PdfTextItemInterface): number => {
    if (left.page !== right.page) {
        return left.page - right.page;
    }

    const yDiff = right.y - left.y;
    if (Math.abs(yDiff) > ERSTE_LAYOUT_Y_ROW_TOLERANCE) {
        return yDiff;
    }

    return left.x - right.x;
};

class ErsteRowGrouper {
    @Log(
        items => `enter itemCount=${items.length}`,
        (result, items) => `done itemCount=${items.length} rowCount=${result.length}`,
        (error, items) => `throw itemCount=${items.length} error=${getErrorMessage(error)}`
    )
    group(items: PdfTextItemInterface[]): ErstePageRowInterface[] {
        const sorted = items.filter(item => item.y >= ERSTE_LAYOUT_FOOTER_Y_THRESHOLD).sort(compareByPageThenRow);
        const buckets: ErsteRowBucket[] = [];

        for (const item of sorted) {
            const last = buckets.at(-1);

            if (isDefined(last) && last.accepts(item)) {
                last.push(item);
            } else {
                buckets.push(new ErsteRowBucket(item.page, item.y, item));
            }
        }

        return buckets.map(bucket => bucket.toPageRow());
    }
}

export const ersteRowGrouper = new ErsteRowGrouper();
