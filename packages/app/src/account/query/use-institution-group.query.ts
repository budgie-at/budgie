import { isInstitutionGroup } from '../type-guard/is-institution-group.type-guard';

import { useHomePageDataQuery } from './use-home-page-data.query';

export const useInstitutionGroupQuery = (integrationId: number) => {
    const { sections, balanceSummary, isLoading } = useHomePageDataQuery();

    return {
        institution:
            sections
                .flatMap(section => section.data)
                .filter(isInstitutionGroup)
                .find(group => group.integrationId === integrationId) ?? null,
        balancesByAccountId: balanceSummary.balancesByAccountId,
        isLoading
    };
};
