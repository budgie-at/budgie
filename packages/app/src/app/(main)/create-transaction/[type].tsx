import { TransactionTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CreateExpenseTransaction } from '../../../transaction/components/create-expense-transaction/create-expense-transaction';
import { CreateIncomeTransaction } from '../../../transaction/components/create-income-transaction/create-income-transaction';
import { CreateTransferTransaction } from '../../../transaction/components/create-transfer-transaction/create-transfer-transaction';

const parseAccountId = (value?: string): number | null => {
    const parsed = isDefined(value) ? Number(value) : null;

    return isPositiveNumber(parsed) ? parsed : null;
};

export default function CreateTransaction() {
    const { type, accountId } = useLocalSearchParams<{ type: TransactionTypeEnum; accountId?: string }>();
    const parsedAccountId = parseAccountId(accountId);

    switch (type) {
        case TransactionTypeEnum.INCOME:
            return <CreateIncomeTransaction accountId={parsedAccountId} />;
        case TransactionTypeEnum.EXPENSE:
            return <CreateExpenseTransaction accountId={parsedAccountId} />;
        case TransactionTypeEnum.TRANSFER:
            return <CreateTransferTransaction accountId={parsedAccountId} />;
        default:
            return <Redirect href="/" />;
    }
}
