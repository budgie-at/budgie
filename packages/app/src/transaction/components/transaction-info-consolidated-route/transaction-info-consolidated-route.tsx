import { TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { Redirect } from 'expo-router';

import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { RefundTransactionInfoContent } from '../refund-transaction-info-content/refund-transaction-info-content';
import { TransactionInfoPage } from '../transaction-info-page/transaction-info-page';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly parentTransaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoConsolidatedRoute = ({ transaction, parentTransaction }: Props) => {
    if (transaction.type === TransactionTypeEnum.INCOME && transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND) {
        return (
            <TransactionInfoPage>
                <RefundTransactionInfoContent transaction={transaction} parentTransaction={parentTransaction} />
            </TransactionInfoPage>
        );
    }

    return <Redirect href={getTransactionHref(parentTransaction)} />;
};
