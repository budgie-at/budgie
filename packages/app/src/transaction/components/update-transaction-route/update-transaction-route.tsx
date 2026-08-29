import { TransactionTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { getTransactionHref } from '../../utils/get-transaction-href.util';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';
import type { ComponentType } from 'react';

interface Props {
    readonly Component: ComponentType<UpdateTransactionFormPropsInterface>;
}

export const UpdateTransactionRoute = ({ Component }: Props) => {
    const { id, openFee } = useLocalSearchParams<IdParamInterface & { openFee?: string }>();
    const transactionId = Number(id);
    const { transaction, isLoading } = useGetTransactionByIdQuery(transactionId);
    const parentTransactionId = transaction?.consolidationParentTransactionId ?? 0;
    const { transaction: parentTransaction, isLoading: isParentLoading } = useGetTransactionByIdQuery(parentTransactionId);

    if (isLoading || !isDefined(transaction)) {
        return isLoading ? null : <Redirect href="/" />;
    }

    if (isDefined(transaction.consolidationParentTransactionId)) {
        if (isParentLoading) {
            return null;
        }

        return isDefined(parentTransaction) ? <Redirect href={getTransactionHref(parentTransaction)} /> : <Redirect href="/" />;
    }

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return <Redirect href={getTransactionHref(transaction)} />;
    }

    return <Component transaction={transaction} openFeeOnMount={openFee === '1'} />;
};
