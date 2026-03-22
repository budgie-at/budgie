import { TransactionCreateInputInterface, TransactionEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { SubmitHandler, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { buildExpenseEntry } from '../utils/build-expense-entry.util';
import { createTransactionInput } from '../utils/create-transaction-input.util';

import type { ZodType } from 'zod';

interface UseTransactionFormConfig<T extends TransactionCreateInputInterface> {
    readonly onSubmit: (data: TransactionCreateInputInterface) => Promise<TransactionEntityInterface>;
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly type: TransactionTypeEnum;
    readonly schema: ZodType<T, T>;
    readonly categoryId?: number;
    readonly comment?: string;
    readonly amount?: number;
}

export const useCreateTransactionForm = <T extends TransactionCreateInputInterface>({
    type,
    schema,
    onSubmit,
    fromAccountId,
    toAccountId,
    amount = 0,
    categoryId = 0,
    comment = ''
}: UseTransactionFormConfig<T>) => {
    const { t } = useLingui();

    const form = useForm({
        mode: 'onSubmit',
        resolver: zodResolver<TransactionCreateInputInterface, unknown, TransactionCreateInputInterface>(schema),
        defaultValues: createTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            comment,
            amount,
            type,
            entries: buildExpenseEntry({ accountId: 0, categoryId, amount: 0, mccCategoryId: null })
        })
    });

    const handleSubmit: SubmitHandler<TransactionCreateInputInterface> = async data => {
        try {
            await onSubmit(data);
            router.back();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Something went wrong.`,
                text2: t`Could not create transaction. Please try again later.`
            });
        }
    };

    const wrappedHandleSubmit = () => form.handleSubmit(handleSubmit)();

    return {
        form,
        handleSubmit: wrappedHandleSubmit
    };
};
