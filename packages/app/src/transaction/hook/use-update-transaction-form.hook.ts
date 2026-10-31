import { Db, TransactionCreateInputInterface, TransactionCreateInputSchema } from '@budgie/contracts';
import { ReceiptMatchInputInterface, TransactionService } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { useForm } from 'react-hook-form';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { attachReceipt } from '../../receipt/utils/attach-receipt.util';

import { useDeleteTransaction } from './use-delete-transaction.hook';

interface UseTransactionFormConfig {
    readonly schema: typeof TransactionCreateInputSchema;
    readonly transaction: TransactionCreateInputInterface;
    readonly id: number;
    readonly receipt?: ReceiptMatchInputInterface | null;
    readonly onAfterSubmit?: (data: TransactionCreateInputInterface) => void;
}

export const useUpdateTransactionForm = ({ id, schema, transaction, receipt = null, onAfterSubmit }: UseTransactionFormConfig) => {
    const { t } = useLingui();
    const deleteTransaction = useDeleteTransaction();
    const { run } = useSingleFlight();

    const form = useForm({
        mode: 'onSubmit',
        values: transaction,
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(schema))
    });

    const handleSubmit = (data: TransactionCreateInputInterface) =>
        run(
            Effect.gen(function* () {
                const transactionService = yield* TransactionService;

                yield* Db.transaction(Effect.andThen(transactionService.updateById(id, data), attachReceipt(receipt, id)));
                onAfterSubmit?.(data);
                goBackOrReplace('/');
            }).pipe(toastOnFailure(t`Could not update transaction.`))
        );

    const handleDelete = () =>
        run(
            Effect.gen(function* () {
                if (yield* deleteTransaction(id)) {
                    dismissAllOrReplace('/');
                }
            })
        );

    return {
        form,
        handleDelete,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
