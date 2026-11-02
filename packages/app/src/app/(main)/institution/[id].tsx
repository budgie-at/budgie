import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { RevealGate } from '../../../@generic/component/reveal-gate/reveal-gate';
import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { InstitutionDetailsPage } from '../../../account/component/institution-details-page/institution-details-page';
import { useHomePageDataQuery } from '../../../account/query/use-home-page-data.query';
import { isInstitutionGroup } from '../../../account/type-guard/is-institution-group.type-guard';
import { BankIntegrationRouteGuard } from '../../../sync/component/bank-integration-route-guard/bank-integration-route-guard';

import { InstitutionSelector } from './institution.selector';

export default function Institution() {
    const id = Number(useLocalSearchParams<IdParamInterface>().id);
    const { sections, balanceSummary, isLoading } = useHomePageDataQuery();
    const institution =
        sections
            .flatMap(section => section.data)
            .filter(isInstitutionGroup)
            .find(group => group.integrationId === id) ?? null;

    if (isLoading) {
        return (
            <GroupedSurface testID={InstitutionSelector.Page}>
                <RevealGate isLoading>{null}</RevealGate>
            </GroupedSurface>
        );
    }

    if (!isDefined(institution) || !isNotEmptyArray(institution.accounts)) {
        return <Redirect href="/" />;
    }

    return (
        <BankIntegrationRouteGuard>
            {integration => (
                <InstitutionDetailsPage
                    integration={integration}
                    institution={institution}
                    balancesByAccountId={balanceSummary.balancesByAccountId}
                />
            )}
        </BankIntegrationRouteGuard>
    );
}
