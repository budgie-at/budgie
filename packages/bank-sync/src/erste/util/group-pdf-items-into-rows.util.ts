import { isDefined } from '@rnw-community/shared';

import { ERSTE_LAYOUT_FOOTER_Y_THRESHOLD } from '../constant/erste.constant';
import { RowBucket } from '../parser/row-bucket';

import { comparePdfItemsByPageThenRow } from './compare-pdf-items-by-page-then-row.util';

import type { PageRowInterface } from '../interface/page-row.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

export const groupPdfItemsIntoRows = (items: PdfTextItemInterface[]): PageRowInterface[] => {
    const sorted = items.filter(item => item.y >= ERSTE_LAYOUT_FOOTER_Y_THRESHOLD).sort(comparePdfItemsByPageThenRow);
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
