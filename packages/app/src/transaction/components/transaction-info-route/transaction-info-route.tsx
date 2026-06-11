import { TransactionTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { getTransactionHref } from '../../utils/get-transaction-href.util';

import type { TransactionInfoRoutePropsInterface } from '../../interface/transaction-info-route-props.interface';

export const TransactionInfoRoute = ({ children }: TransactionInfoRoutePropsInterface) => {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const transactionId = Number(id);
    const { transaction, isLoading } = useGetTransactionByIdQuery(transactionId);
    const parentTransactionId = transaction?.consolidationParentTransactionId ?? 0;
    const { transaction: parentTransaction, isLoading: isParentLoading } = useGetTransactionByIdQuery(parentTransactionId);

    if (isLoading) {
        return null;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    if (isDefined(transaction.consolidationParentTransactionId)) {
        return isParentLoading || !isDefined(parentTransaction) ? null : <Redirect href={getTransactionHref(parentTransaction)} />;
    }

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return <Redirect href={getTransactionHref(transaction)} />;
    }

    return children(transaction, transactionId);
};
