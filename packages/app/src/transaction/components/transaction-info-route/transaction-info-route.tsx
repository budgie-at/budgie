import { TransactionTypeEnum } from '@budgie/contracts';
import { Redirect, useFocusEffect, useIsFocused, useLocalSearchParams } from 'expo-router';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useGetTransactionByIdQuery } from '../../query/use-get-transaction-by-id.query';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionInfoConsolidatedRoute } from '../transaction-info-consolidated-route/transaction-info-consolidated-route';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';

interface Props {
    readonly transactionType?: TransactionTypeEnum;
    readonly children: (transaction: TransactionWithRelationsEntityInterface) => ReactNode;
}

export const TransactionInfoRoute = ({ children, transactionType }: Props) => {
    const isFocused = useIsFocused();
    const { id } = useLocalSearchParams<IdParamInterface>();
    const parsedTransactionId = Number(id);
    const transactionId = isPositiveNumber(parsedTransactionId) ? parsedTransactionId : null;
    const { transaction, isLoading } = useGetTransactionByIdQuery(transactionId);
    const { transaction: parentTransaction, isLoading: isParentLoading } = useGetTransactionByIdQuery(
        isDefined(transaction) ? transaction.consolidationParentTransactionId : null
    );

    const isMissing = !isLoading && (!isDefined(transactionId) || !isDefined(transaction));

    useFocusEffect(() => {
        if (isMissing) {
            goBackOrReplace('/');
        }
    });

    if (isLoading || !isDefined(transactionId) || !isDefined(transaction)) {
        return null;
    }

    if (isDefined(transaction.consolidationParentTransactionId)) {
        return isParentLoading || !isDefined(parentTransaction) ? null : (
            <TransactionInfoConsolidatedRoute transaction={transaction} parentTransaction={parentTransaction} />
        );
    }

    if (
        transaction.type === TransactionTypeEnum.ADJUSTMENT ||
        (isFocused && isDefined(transactionType) && transaction.type !== transactionType)
    ) {
        return <Redirect href={getTransactionHref(transaction)} />;
    }

    return children(transaction);
};
