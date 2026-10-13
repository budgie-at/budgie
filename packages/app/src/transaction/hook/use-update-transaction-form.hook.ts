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
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';

import { useDeleteTransaction } from './use-delete-transaction.hook';

interface UseTransactionFormConfig {
    readonly schema: typeof TransactionCreateInputSchema;
    readonly transaction: TransactionCreateInputInterface;
    readonly id: number;
    readonly onAfterSubmit?: (data: TransactionCreateInputInterface) => void;
}

export const useUpdateTransactionForm = ({ id, schema, transaction, onAfterSubmit }: UseTransactionFormConfig) => {
    const { t } = useLingui();
    const deleteTransaction = useDeleteTransaction();

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
        if (await deleteTransaction(id)) {
            dismissAllOrReplace('/');
        }
    };

    return {
        form,
        handleDelete,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
