import { isDefined } from '@rnw-community/shared';

import {
    ERSTE_LAYOUT_FOOTER_Y_THRESHOLD,
    ERSTE_LAYOUT_RIGHT_COLUMN_X_THRESHOLD,
    ERSTE_LAYOUT_Y_ROW_TOLERANCE
} from '../constant/erste.constant';

import type { ErstePageRowInterface } from '../interface/erste-page-row.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

class ErsteRowGrouper {
    group(items: PdfTextItemInterface[]): ErstePageRowInterface[] {
        const sorted = items
            .filter(item => item.y >= ERSTE_LAYOUT_FOOTER_Y_THRESHOLD)
            .sort((left, right) => this.compareByPageThenRow(left, right));
        const groups: PdfTextItemInterface[][] = [];

        for (const item of sorted) {
            const last = groups.at(-1);
            const seed = last?.at(0);

            if (
                isDefined(last) &&
                isDefined(seed) &&
                seed.page === item.page &&
                Math.abs(seed.y - item.y) <= ERSTE_LAYOUT_Y_ROW_TOLERANCE
            ) {
                last.push(item);
            } else {
                groups.push([item]);
            }
        }

        return groups.map(group => this.toPageRow(group));
    }

    private toPageRow(group: PdfTextItemInterface[]): ErstePageRowInterface {
        const sorted = [...group].sort((left, right) => left.x - right.x);

        return {
            page: sorted[0].page,
            y: group[0].y,
            leftItems: sorted.filter(item => item.x < ERSTE_LAYOUT_RIGHT_COLUMN_X_THRESHOLD),
            rightItems: sorted.filter(item => item.x >= ERSTE_LAYOUT_RIGHT_COLUMN_X_THRESHOLD)
        };
    }

    private compareByPageThenRow(left: PdfTextItemInterface, right: PdfTextItemInterface): number {
        if (left.page !== right.page) {
            return left.page - right.page;
        }

        const yDiff = right.y - left.y;
        if (Math.abs(yDiff) > ERSTE_LAYOUT_Y_ROW_TOLERANCE) {
            return yDiff;
        }

        return left.x - right.x;
    }
}

export const ersteRowGrouper = new ErsteRowGrouper();
