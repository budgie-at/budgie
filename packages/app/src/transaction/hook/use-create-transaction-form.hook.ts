import {
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { SubmitHandler, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

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
            entries: [{ accountId: 0, categoryId, amount: 0, type: TransactionEntryTypeEnum.CREDIT, mccCategoryId: null, externalId: null }]
        })
    });

    const handleSubmit: SubmitHandler<TransactionCreateInputInterface> = async data => {
        console.log('[useCreateTransactionForm] handleSubmit called with data:', JSON.stringify(data, null, 2));

        try {
            await onSubmit(data);
            router.back();
        } catch (error) {
            console.error('[useCreateTransactionForm] Error:', error);
            Toast.show({
                type: 'error',
                text1: t`Something went wrong.`,
                text2: t`Could not create transaction. Please try again later.`
            });
        }
    };

    const wrappedHandleSubmit = async () => {
        console.log('[useCreateTransactionForm] wrappedHandleSubmit called');
        console.log('[useCreateTransactionForm] Form values:', JSON.stringify(form.getValues(), null, 2));

        return form.handleSubmit(handleSubmit, errors => {
            console.error('[useCreateTransactionForm] Validation errors:', JSON.stringify(errors, null, 2));
        })();
    };

    return {
        form,
        handleSubmit: wrappedHandleSubmit
    };
};
