import { TransactionCreateEntityInterface } from '@budgie/contracts';
import { useFormContext } from 'react-hook-form';

export const useTransactionFormContext = () => useFormContext<TransactionCreateEntityInterface>()
