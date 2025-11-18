import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { UpdateLiabilityAccount } from '../../../account/component/update-liability-account/update-liability-account';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';

export default function EditAccount() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { account } = useGetAccountByIdQuery(Number(id));

    if (!isDefined(account)) {
        return <Redirect href="/" />;
    }

    return <UpdateLiabilityAccount account={account} />;
}
