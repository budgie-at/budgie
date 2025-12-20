import {
    isExpenseTransaction,
    isIncomeTransaction,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    isTransferTransaction
} from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/components/empty-screen/empty-screen';
import { IdParamInterface } from '../../../@generic/interface/id-param.interface';
import { UpdateTransferTransaction } from '../../../transaction/components/create-transfer-transaction/update-transfer-transaction';
import { UpdateExpenseTransaction } from '../../../transaction/components/update-expense-transaction/update-expense-transaction';
import { UpdateIncomeTransaction } from '../../../transaction/components/update-income-transaction/update-income-transaction';
import { useGetTransactionByIdQuery } from '../../../transaction/query/use-get-transaction-by-id.query';

export default function TransactionDetailsScreen() {
    const { id } = useLocalSearchParams<IdParamInterface>();

    const { transaction, isLoading } = useGetTransactionByIdQuery(Number(id));

    if (isLoading) {
        return <EmptyScreen />;
    }

    if (!isDefined(transaction)) {
        return <Redirect href="/" />;
    }

    if (isTransferTransaction(transaction)) {
        return <UpdateTransferTransaction transaction={transaction} />;
    }

    if (isIncomeTransaction(transaction) || isPositiveAdjustmentTransaction(transaction)) {
        return <UpdateIncomeTransaction transaction={transaction} />;
    }

    if (isExpenseTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return <UpdateExpenseTransaction transaction={transaction} />;
    }

    return <Redirect href="/" />;
}
