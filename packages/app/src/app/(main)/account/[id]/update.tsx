import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../../@generic/component/empty-screen/empty-screen';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { UpdateLiabilityAccount } from '../../../../account/component/update-liability-account/update-liability-account';
import { useGetAccountByIdQuery } from '../../../../account/query/use-get-account-by-id.query';

export default function UpdateAccount() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { account, isLoading } = useGetAccountByIdQuery(Number(id));

    if (isLoading) {
        return <EmptyScreen />;
    }

    if (!isDefined(account)) {
        return <Redirect href="/" />;
    }

    return <UpdateLiabilityAccount account={account} />;
}
