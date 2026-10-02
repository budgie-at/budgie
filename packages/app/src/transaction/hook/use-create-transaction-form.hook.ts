import {
    TransactionCreateInputInterface,
    TransactionCreateInputSchema,
    TransactionEntityInterface,
    TransactionTypeEnum
} from '@budgie/contracts';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Schema from 'effect/Schema';
import { router } from 'expo-router';
import { SubmitHandler, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { buildExpenseEntry } from '../utils/build-expense-entry.util';
import { createTransactionInput } from '../utils/create-transaction-input.util';

interface UseTransactionFormConfig {
    readonly onSubmit: (data: TransactionCreateInputInterface) => Promise<TransactionEntityInterface>;
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly type: TransactionTypeEnum;
    readonly schema: typeof TransactionCreateInputSchema;
    readonly categoryId?: number;
    readonly comment?: string;
    readonly amount?: number;
}

export const useCreateTransactionForm = ({
    type,
    schema,
    onSubmit,
    fromAccountId,
    toAccountId,
    amount = 0,
    categoryId = 0,
    comment = ''
}: UseTransactionFormConfig) => {
    const { t } = useLingui();

    const form = useForm({
        mode: 'onSubmit',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(schema)),
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
                text1: t`Could not create transaction`,
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
