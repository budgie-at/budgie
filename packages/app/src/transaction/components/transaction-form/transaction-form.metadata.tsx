import { useTransactionFormContext } from '../../context/transaction-form.context';
import { TransactionFormMetadataFields } from '../transaction-form-meta-fields/transaction-form-meta-fields';

export const TransactionFormMetadata = () => {
    const { control, variant } = useTransactionFormContext();

    return <TransactionFormMetadataFields control={control} variant={variant} />;
};
