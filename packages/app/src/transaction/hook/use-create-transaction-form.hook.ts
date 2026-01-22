import {
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { SubmitHandler, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { createTransactionEntryInput } from '../utils/create-transaction-entry-input.util';
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
    entries?: Array<{ categoryId: number; amount: number }> | null;
}

interface BuildFormEntriesParamsInterface {
    fromAccountId: number | null;
    toAccountId: number | null;
    amount: number;
    categoryId: number;
    entries?: Array<{ categoryId: number; amount: number }> | null;
}

const buildMainEntry = ({
    fromAccountId,
    toAccountId,
    amount,
    categoryId
}: Omit<BuildFormEntriesParamsInterface, 'entries'>): Omit<TransactionEntryCreateEntityInterface, 'transactionId'> => {
    if (isDefined(fromAccountId)) {
        return createTransactionEntryInput({
            accountId: fromAccountId,
            type: TransactionEntryTypeEnum.CREDIT,
            amount,
            categoryId
        });
    }

    if (isDefined(toAccountId)) {
        return createTransactionEntryInput({
            accountId: toAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            amount,
            categoryId
        });
    }

    return createTransactionEntryInput({
        categoryId,
        accountId: 0,
        type: TransactionEntryTypeEnum.CREDIT
    });
};

const buildEntriesFromInput = (
    entries: Array<{ categoryId: number; amount: number }>,
    fromAccountId: number | null,
    toAccountId: number | null
): Array<Omit<TransactionEntryCreateEntityInterface, 'transactionId'>> =>
    entries.map(entry =>
        createTransactionEntryInput({
            accountId: fromAccountId ?? toAccountId ?? 0,
            type: isDefined(fromAccountId) ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT,
            amount: entry.amount,
            categoryId: entry.categoryId
        })
    );

const buildFormEntries = ({
    fromAccountId,
    toAccountId,
    amount,
    categoryId,
    entries
}: BuildFormEntriesParamsInterface): Array<Omit<TransactionEntryCreateEntityInterface, 'transactionId'>> => {
    if (isNotEmptyArray(entries)) {
        return buildEntriesFromInput(entries, fromAccountId, toAccountId);
    }

    return [buildMainEntry({ fromAccountId, toAccountId, amount, categoryId })];
};

export const useCreateTransactionForm = <T extends TransactionCreateInputInterface>({
    type,
    schema,
    onSubmit,
    fromAccountId,
    toAccountId,
    amount = 0,
    categoryId = 0,
    comment = '',
    entries
}: UseTransactionFormConfig<T>) => {
    const { t } = useLingui();

    const form = useForm({
        mode: 'onSubmit',
        resolver: zodResolver<TransactionCreateInputInterface, unknown, TransactionCreateInputInterface>(schema),
        values: createTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            comment,
            amount,
            type,
            entries: buildFormEntries({ fromAccountId, toAccountId, amount, categoryId, entries })
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

    return {
        form,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
