import { useTransactionFormContext } from '../../context/transaction-form.context';
import { useTransferValidation } from '../../hook/use-transfer-validation.hook';
import { TransferTransactionFormAccounts } from '../transfer-transaction-form/transfer-transaction-form-accounts';

export const TransactionFormAccounts = () => {
    const { control, setValue, variant } = useTransactionFormContext();

    useTransferValidation();

    return <TransferTransactionFormAccounts control={control} setValue={setValue} variant={variant} />;
};
