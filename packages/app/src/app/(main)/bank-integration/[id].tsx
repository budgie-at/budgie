import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { LoadingScreen } from '../../../@generic/component/loading-screen/loading-screen';
import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { BankIntegrationPage } from '../../../sync/component/bank-integration-page/bank-integration-page';
import { useGetBankIntegrationByIdQuery } from '../../../sync/query/use-get-bank-integration-by-id.query';

export default function BankIntegrationRoute() {
    const params = useLocalSearchParams<IdParamInterface>();
    const id = Number(params.id);
    const { integration, isLoading } = useGetBankIntegrationByIdQuery(id);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isDefined(integration)) {
        return <Redirect href="/" />;
    }

    return <BankIntegrationPage integration={integration} />;
}
