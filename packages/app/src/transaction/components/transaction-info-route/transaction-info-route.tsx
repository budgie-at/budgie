import { TransactionTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { getTransactionHref } from '../../utils/get-transaction-href.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly children: (transaction: TransactionWithRelationsEntityInterface, transactionId: number) => ReactNode;
}

export const TransactionInfoRoute = ({ children }: Props) => {
    const { id } = useLocalSearchParams<IdParamInterface>();
    const parsedTransactionId = Number(id);
    const transactionId = isPositiveNumber(parsedTransactionId) ? parsedTransactionId : null;
    const { transaction, isLoading } = useGetTransactionByIdQuery(transactionId);
    const parentTransactionId = isDefined(transaction) ? transaction.consolidationParentTransactionId : null;
    const { transaction: parentTransaction, isLoading: isParentLoading } = useGetTransactionByIdQuery(parentTransactionId);

    if (isLoading) {
        return null;
    }

    if (!isDefined(transactionId) || !isDefined(transaction)) {
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
