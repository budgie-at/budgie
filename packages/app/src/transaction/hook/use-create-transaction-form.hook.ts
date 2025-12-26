import {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { SubmitHandler, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { createTransactionEntryInput } from '../utils/create-transaction-entry-input.util';
import { createTransactionInput } from '../utils/create-transaction-input.util';

import type { ZodType } from 'zod';

interface UseTransactionFormConfig<T extends TransactionCreateEntityInterface> {
    onSubmit: (data: TransactionCreateEntityInterface) => Promise<TransactionEntityInterface>;
    fromAccountId: number | null;
    toAccountId: number | null;
    type: TransactionTypeEnum;
    schema: ZodType<T, T>;
    categoryId?: number;
    amount?: number;
}

export const useCreateTransactionForm = <T extends TransactionCreateEntityInterface>(props: UseTransactionFormConfig<T>) => {
    const { type, schema, onSubmit, fromAccountId, toAccountId, amount = 0, categoryId = 0 } = props;

    const { t } = useLingui();

    const form = useForm({
        mode: 'onSubmit',
        resolver: zodResolver<TransactionCreateEntityInterface, unknown, TransactionCreateEntityInterface>(schema),
        values: createTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            type,
            entries: [
                ...(isDefined(fromAccountId)
                    ? [
                          createTransactionEntryInput({
                              accountId: fromAccountId,
                              type: TransactionEntryTypeEnum.DEBIT,
                              amount,
                              categoryId
                          })
                      ]
                    : []),
                ...(isDefined(toAccountId)
                    ? [
                          createTransactionEntryInput({
                              accountId: toAccountId,
                              type: TransactionEntryTypeEnum.CREDIT,
                              amount,
                              categoryId
                          })
                      ]
                    : []),
                ...(!isDefined(fromAccountId) && !isDefined(toAccountId)
                    ? [
                          createTransactionEntryInput({
                              categoryId,
                              accountId: 0,
                              type: TransactionEntryTypeEnum.DEBIT
                          }),
                          createTransactionEntryInput({
                              categoryId,
                              accountId: 0,
                              type: TransactionEntryTypeEnum.CREDIT
                          })
                      ]
                    : [])
            ]
        })
    });

    const handleSubmit: SubmitHandler<TransactionCreateEntityInterface> = async data => {
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

    return {
        form,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
