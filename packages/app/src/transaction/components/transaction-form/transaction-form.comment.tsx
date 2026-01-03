import { useTransactionFormContext } from '../../context/transaction-form.context';
import { TransactionFormComment as TransactionFormCommentBase } from '../transaction-form-comment/transaction-form-comment';

export const TransactionFormComment = () => {
    const { control } = useTransactionFormContext();

    return <TransactionFormCommentBase control={control} />;
};
