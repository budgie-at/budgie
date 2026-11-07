import { TransactionTypeEnum } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { foreignTransferLegAtom } from '../../constant/foreign-transfer-leg-atom.constant';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { getTransactionHref } from '../../utils/get-transaction-href.util';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';
import type { ComponentType } from 'react';

interface Props {
    readonly Component: ComponentType<UpdateTransactionFormPropsInterface>;
}

export const UpdateTransactionRoute = ({ Component }: Props) => {
    const { id, openFee } = useLocalSearchParams<IdParamInterface & { openFee?: string }>();
    const { transaction, isLoading } = useGetTransactionByIdQuery(Number(id));
    const legResult = useLiveAtomValue(foreignTransferLegAtom(Number(id)));
    const { transaction: parentTransaction, isLoading: isParentLoading } = useGetTransactionByIdQuery(
        transaction?.consolidationParentTransactionId ?? 0
    );

    if (isLoading || AsyncResult.isInitial(legResult)) {
        return null;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    if (isDefined(transaction.consolidationParentTransactionId)) {
        if (isParentLoading) {
            return null;
        }

        return isDefined(parentTransaction) ? <Redirect href={getTransactionHref(parentTransaction)} /> : <Redirect href="/" />;
    }

    if (AsyncResult.getOrElse(legResult, () => true) || transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return <Redirect href={getTransactionHref(transaction)} />;
    }

    return <Component transaction={transaction} openFeeOnMount={openFee === '1'} />;
};
