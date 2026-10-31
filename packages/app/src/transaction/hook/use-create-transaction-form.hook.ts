import {
    TransactionCreateInputInterface,
    TransactionCreateInputSchema,
    TransactionEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { createTransactionInput } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { buildPrimaryEntry } from '../utils/build-primary-entry.util';

import type { AppServices } from '../../@generic/runtime/app.runtime';

interface UseTransactionFormConfig {
    readonly onSubmit: (data: TransactionCreateInputInterface) => Effect.Effect<TransactionEntityInterface, unknown, AppServices>;
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly type: TransactionTypeEnum;
    readonly schema: typeof TransactionCreateInputSchema;
    readonly categoryId?: number;
    readonly comment?: string;
    readonly title?: string;
    readonly operatedAt?: Date;
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
    comment = '',
    title = '',
    operatedAt
}: UseTransactionFormConfig) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();

    const form = useForm({
        mode: 'onSubmit',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(schema)),
        defaultValues: {
            ...createTransactionInput({
                exchangeRate: 1,
                fromAccountId,
                toAccountId,
                comment,
                amount,
                type,
                entries: buildPrimaryEntry(TransactionEntryTypeEnum.CREDIT, { accountId: 0, categoryId, amount: 0, mccCategoryId: null })
            }),
            title,
            ...(isDefined(operatedAt) && { operatedAt })
        }
    });

    const handleSubmit = (data: TransactionCreateInputInterface) =>
        run(
            onSubmit(data).pipe(
                Effect.tap(() =>
                    Effect.sync(() => {
                        router.back();
                    })
                ),
                toastOnFailure(t`Could not create transaction`, t`Could not create transaction. Please try again later.`)
            )
        );

    const wrappedHandleSubmit = () => form.handleSubmit(handleSubmit)();

    return {
        form,
        handleSubmit: wrappedHandleSubmit
    };
};
