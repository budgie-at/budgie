import { TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { Redirect } from 'expo-router';

import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { RefundTransactionInfoPage } from '../refund-transaction-info-page/refund-transaction-info-page';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly parentTransaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoConsolidatedRoute = ({ transaction, parentTransaction }: Props) => {
    if (transaction.type === TransactionTypeEnum.INCOME && transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND) {
        return <RefundTransactionInfoPage transaction={transaction} parentTransaction={parentTransaction} />;
    }

    return <Redirect href={getTransactionHref(parentTransaction)} />;
};
