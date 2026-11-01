import { isDefined } from '@rnw-community/shared';

import { getCategorizeInboxRowPosition } from '../../categorize-inbox/utils/get-categorize-inbox-row-position.util';
import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';

const isInstitution = (item: object | undefined): boolean => isDefined(item) && 'provider' in item;

export const getHomeSectionItemPosition = (data: readonly object[], index: number): TransactionListRowPositionEnum => {
    if (isInstitution(data[index])) {
        return TransactionListRowPositionEnum.SINGLE;
    }

    const hasPrevious = index > 0 && !isInstitution(data[index - 1]);
    const hasNext = index < data.length - 1 && !isInstitution(data[index + 1]);

    return getCategorizeInboxRowPosition(hasPrevious, hasNext);
};
