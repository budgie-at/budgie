import { isInstitutionGroup } from '../type-guard/is-institution-group.type-guard';

import type { HomeSectionInterface } from '../interface/home-section.interface';

export const getHomeSectionItemKey = (item: HomeSectionInterface['data'][number]): string => {
    if (isInstitutionGroup(item)) {
        return `institution-${item.integrationId}`;
    }

    return 'accounts' in item ? `crypto-${item.instrument.id}` : String(item.id);
};
