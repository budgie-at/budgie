import { isDefined } from '@rnw-community/shared';

import { getCategorizeInboxRowPosition } from '../../categorize-inbox/utils/get-categorize-inbox-row-position.util';
import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import { getTransactionListRowPosition } from '../../transaction/utils/get-transaction-list-row-position.util';
import { HomeSectionInterface } from '../interface/home-section.interface';
import { isCashSection } from '../type-guard/is-cash-section.type-guard';
import { isInstitutionGroup } from '../type-guard/is-institution-group.type-guard';

const isInstitution = (item: object | undefined): boolean => isDefined(item) && isInstitutionGroup(item);

export const getHomeSectionItemPosition = (section: HomeSectionInterface, index: number): TransactionListRowPositionEnum => {
    if (isCashSection(section)) {
        return getTransactionListRowPosition(index, section.data.length + 1);
    }

    const { data } = section;

    if (isInstitution(data[index])) {
        return TransactionListRowPositionEnum.SINGLE;
    }

    const hasPrevious = index > 0 && !isInstitution(data[index - 1]);
    const hasNext = index < data.length - 1 && !isInstitution(data[index + 1]);

    return getCategorizeInboxRowPosition(hasPrevious, hasNext);
};
