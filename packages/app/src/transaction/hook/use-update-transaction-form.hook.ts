import { TransactionCreateInputInterface } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { SubmitHandler, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { transactionService } from '../service/transaction.service';

import type { ZodType } from 'zod';

interface UseTransactionFormConfig<T extends TransactionCreateInputInterface> {
    readonly schema: ZodType<T, T>;
    readonly transaction: T;
    readonly id: number;
    readonly onAfterSubmit?: (data: TransactionCreateInputInterface) => void;
}

export const useUpdateTransactionForm = <T extends TransactionCreateInputInterface>({
    id,
    schema,
    transaction,
    onAfterSubmit
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
            onAfterSubmit?.(data);
            goBackOrReplace('/');
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Could not update transaction.`,
                text2: getErrorMessage(error)
            });
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirmAlert({
            title: t`Are you sure?`,
            message: t`This action cannot be undone.`,
            confirmText: t`Delete`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        try {
            await transactionService.deleteById(id);
            dismissAllOrReplace('/');
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Could not delete transaction.`,
                text2: getErrorMessage(error)
            });
        }
    };

    return {
        form,
        handleDelete,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
