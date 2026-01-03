import { TransactionTypeEnum } from '@budgie/contracts';
import { useWatch } from 'react-hook-form';

import { useTransactionFormContext } from '../../context/transaction-form.context';
import { TransactionFormCategory as TransactionFormCategoryBase } from '../transaction-form-category/transaction-form-category';

export interface TransactionFormCategoryProps {
    readonly transactionType: TransactionTypeEnum;
}

export const TransactionFormCategory = ({ transactionType }: TransactionFormCategoryProps) => {
    const { control, variant, setValue } = useTransactionFormContext();

    const [fromAccountId, toAccountId] = useWatch({
        control,
        name: ['fromAccountId', 'toAccountId']
    });

    const accountId = fromAccountId ?? toAccountId ?? 0;

    return (
        <TransactionFormCategoryBase
            control={control}
            setValue={setValue}
            transactionType={transactionType}
            variant={variant}
            accountId={accountId}
        />
    );
};
