import { TransactionCreateInputInterface } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { SubmitHandler, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { transactionService } from '../service/transaction.service';

import type { ZodType } from 'zod';

interface UseTransactionFormConfig<T extends TransactionCreateInputInterface> {
    schema: ZodType<T, T>;
    transaction: T;
    id: number;
}

export const useUpdateTransactionForm = <T extends TransactionCreateInputInterface>({
    id,
    schema,
    transaction
}: UseTransactionFormConfig<T>) => {
    const { t } = useLingui();

    const form = useForm({
        mode: 'onSubmit',
        values: transaction,
        resolver: zodResolver<TransactionCreateInputInterface, unknown, TransactionCreateInputInterface>(schema)
    });

    const handleSubmit: SubmitHandler<TransactionCreateInputInterface> = async data => {
        try {
            await transactionService.updateById(id, data);
            goBackOrReplace('/');
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong.`,
                text2: t`Could not update transaction. Please try again later.`
            });
        }
    };

    return {
        form,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
