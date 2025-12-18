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

import { useSettingsContext } from '../../settings/context/settings.context';
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
}

export const useCreateTransactionForm = <T extends TransactionCreateEntityInterface>({
    type,
    schema,
    onSubmit,
    categoryId,
    toAccountId,
    fromAccountId
}: UseTransactionFormConfig<T>) => {
    const { t } = useLingui();
    const { defaultInstrument, defaultAccount } = useSettingsContext();

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
                              type: TransactionEntryTypeEnum.CREDIT,
                              instrumentId: defaultAccount?.instrumentId ?? defaultInstrument.id
                          })
                      ]
                    : []),
                ...(isDefined(toAccountId)
                    ? [
                          createTransactionEntryInput({
                              accountId: toAccountId,
                              type: TransactionEntryTypeEnum.DEBIT,
                              instrumentId: defaultAccount?.instrumentId ?? defaultInstrument.id
                          })
                      ]
                    : []),
                ...(!isDefined(fromAccountId) && !isDefined(toAccountId)
                    ? [
                          createTransactionEntryInput({
                              categoryId,
                              accountId: 0,
                              instrumentId: defaultInstrument.id,
                              type: TransactionEntryTypeEnum.CREDIT
                          }),
                          createTransactionEntryInput({
                              categoryId,
                              accountId: 0,
                              instrumentId: defaultInstrument.id,
                              type: TransactionEntryTypeEnum.DEBIT
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
