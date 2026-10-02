import { TransactionCreateInputInterface, TransactionCreateInputSchema } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { SubmitHandler, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';

interface UseTransactionFormConfig {
    readonly schema: typeof TransactionCreateInputSchema;
    readonly transaction: TransactionCreateInputInterface;
    readonly id: number;
    readonly onAfterSubmit?: (data: TransactionCreateInputInterface) => void;
}

export const useUpdateTransactionForm = ({ id, schema, transaction, onAfterSubmit }: UseTransactionFormConfig) => {
    const { t } = useLingui();

    const form = useForm({
        mode: 'onSubmit',
        values: transaction,
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(schema))
    });

    const handleSubmit: SubmitHandler<TransactionCreateInputInterface> = async data => {
        try {
            await appRuntime.runPromise(Effect.flatMap(TransactionService, transactionService => transactionService.updateById(id, data)));
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
            await appRuntime.runPromise(Effect.flatMap(TransactionService, transactionService => transactionService.deleteById(id)));
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
