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
    onSubmit: (data: TransactionCreateInputInterface) => Promise<TransactionEntityInterface>;
    fromAccountId: number | null;
    toAccountId: number | null;
    type: TransactionTypeEnum;
    schema: ZodType<T, T>;
    categoryId?: number;
    comment?: string;
    amount?: number;
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
            const start = performance.now();
            console.log('[CreateForm] handleSubmit START'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            await onSubmit(data);
            console.log(`[CreateForm] onSubmit done in ${(performance.now() - start).toFixed(0)}ms`); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            router.back();
            console.log(`[CreateForm] router.back() done in ${(performance.now() - start).toFixed(0)}ms`); // eslint-disable-line no-console, lingui/no-unlocalized-strings
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
