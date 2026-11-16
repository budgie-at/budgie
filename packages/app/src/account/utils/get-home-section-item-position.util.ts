import { isDefined } from '@rnw-community/shared';

import { getCategorizeInboxRowPosition } from '../../categorize-inbox/utils/get-categorize-inbox-row-position.util';
import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import { getTransactionListRowPosition } from '../../transaction/utils/get-transaction-list-row-position.util';
import { HomeSectionInterface } from '../interface/home-section.interface';
import { isCashSection } from '../type-guard/is-cash-section.type-guard';
import { isInstitutionGroup } from '../type-guard/is-institution-group.type-guard';

const isStandaloneInstitution = (item: object): boolean => isInstitutionGroup(item) && !item.isHoldingProvider;

const isHoldingProvider = (item: object): boolean => isInstitutionGroup(item) && item.isHoldingProvider;

const isSameCard = (item: object, neighbour: object | null | undefined): boolean =>
    isDefined(neighbour) && !isStandaloneInstitution(neighbour) && isHoldingProvider(item) === isHoldingProvider(neighbour);

export const getHomeSectionItemPosition = (section: HomeSectionInterface, index: number): TransactionListRowPositionEnum => {
    if (isCashSection(section)) {
        return getTransactionListRowPosition(index, section.data.length + 1);
    }

    const { data } = section;
    const item = data[index];

    if (isStandaloneInstitution(item)) {
        return TransactionListRowPositionEnum.SINGLE;
    }

    const previous = index > 0 ? data[index - 1] : null;

    return getCategorizeInboxRowPosition(isSameCard(item, previous), isSameCard(item, data.at(index + 1)));
};
