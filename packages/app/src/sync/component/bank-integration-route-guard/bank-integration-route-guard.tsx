import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { useGetBankIntegrationByIdQuery } from '../../query/use-get-bank-integration-by-id.query';

import type { BankIntegrationEntityInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly children: (integration: BankIntegrationEntityInterface) => ReactNode;
}

export const BankIntegrationRouteGuard = ({ children }: Props) => {
    const params = useLocalSearchParams<IdParamInterface>();
    const id = Number(params.id);
    const { integration, isLoading } = useGetBankIntegrationByIdQuery(id);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(integration)) {
        return <Redirect href="/" />;
    }

    return children(integration);
};
