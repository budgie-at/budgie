import { isDefined } from '@rnw-community/shared';

import type { ErstePageRowInterface } from '../interface/erste-page-row.interface';
import type { PdfTextItemInterface } from '../interface/pdf-text-item.interface';

const Y_ROW_TOLERANCE = 3;
const RIGHT_COLUMN_X_THRESHOLD = 250;
const FOOTER_Y_THRESHOLD = 50;

const compareByPageThenRow = (left: PdfTextItemInterface, right: PdfTextItemInterface): number => {
    if (left.page !== right.page) {
        return left.page - right.page;
    }

    const yDiff = right.y - left.y;

    return Math.abs(yDiff) > Y_ROW_TOLERANCE ? yDiff : left.x - right.x;
};

const toPageRow = (group: PdfTextItemInterface[]): ErstePageRowInterface => {
    const sorted = [...group].sort((left, right) => left.x - right.x);

    return {
        page: sorted[0].page,
        y: group[0].y,
        leftItems: sorted.filter(item => item.x < RIGHT_COLUMN_X_THRESHOLD),
        rightItems: sorted.filter(item => item.x >= RIGHT_COLUMN_X_THRESHOLD)
    };
};

export const groupErsteRows = (items: PdfTextItemInterface[]): ErstePageRowInterface[] => {
    const groups: PdfTextItemInterface[][] = [];

    for (const item of items.filter(pageItem => pageItem.y >= FOOTER_Y_THRESHOLD).sort(compareByPageThenRow)) {
        const last = groups.at(-1);
        const seed = last?.at(0);

        if (isDefined(last) && isDefined(seed) && seed.page === item.page && Math.abs(seed.y - item.y) <= Y_ROW_TOLERANCE) {
            last.push(item);
        } else {
            groups.push([item]);
        }
    }

    return groups.map(toPageRow);
};
