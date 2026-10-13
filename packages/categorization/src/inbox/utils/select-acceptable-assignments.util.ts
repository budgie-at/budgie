import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';

export const selectAcceptableAssignments = (
    items: readonly CategorizeInboxListItemType[],
    excludedTransactionIds: ReadonlySet<number>
): CategorizeInboxAssignmentInterface[] =>
    items.flatMap(item => {
        if (!('rows' in item) || item.section !== CategorizeInboxSectionEnum.CONFIDENT) {
            return [];
        }

        const labelId = item.candidateLabelIds.at(0);
        const includedRows = item.rows.filter(row => !excludedTransactionIds.has(row.transactionId));

        return isDefined(labelId) && isNotEmptyArray(includedRows) ? [{ ...item, rows: includedRows, labelId }] : [];
    });
