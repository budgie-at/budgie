import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { IncomeTransaction } from '../../../transaction/components/income-transaction/income-transaction';
import { useGetTransactionByIdQuery } from '../../../transaction/query/use-get-transaction-by-id.query';

export default function EditTransaction() {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const { transaction, isLoading } = useGetTransactionByIdQuery(Number(id));

    if (isLoading) {
        return null;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    return <IncomeTransaction transaction={transaction} />;
}
