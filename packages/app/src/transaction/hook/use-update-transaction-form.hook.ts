import { Db, ExternalSourceEnum, TransactionCreateInputInterface, TransactionCreateInputSchema } from '@budgie/contracts';
import { ReceiptMatchInputInterface, TransactionService } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NotificationFeedbackType } from 'expo-haptics';
import { useForm } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { BROKERAGE_FUNDING_TITLE } from '../../brokerage/constant/brokerage-funding-title.constant';
import { BrokerageService } from '../../brokerage/service/brokerage.service';
import { attachReceipt } from '../../receipt/utils/attach-receipt.util';
import { RecurringRefreshModeEnum } from '../../recurring/enum/recurring-refresh-mode.enum';
import { scheduleRecurringRefresh } from '../../recurring/utils/schedule-recurring-refresh.util';

import { useDeleteTransaction } from './use-delete-transaction.hook';

interface UseTransactionFormConfig {
    readonly schema: typeof TransactionCreateInputSchema;
    readonly transaction: TransactionCreateInputInterface;
    readonly persistedTitle: string;
    readonly id: number;
    readonly receipt?: ReceiptMatchInputInterface | null;
    readonly onAfterSubmit?: (data: TransactionCreateInputInterface) => void;
}

export const useUpdateTransactionForm = ({
    id,
    schema,
    transaction,
    persistedTitle,
    receipt = null,
    onAfterSubmit
}: UseTransactionFormConfig) => {
    const { t } = useLingui();
    const deleteTransaction = useDeleteTransaction();
    const { run } = useSingleFlight();
    const [hapticNotification] = useVibration();

    const form = useForm({
        mode: 'onSubmit',
        values: transaction,
        resolver: standardSchemaResolver(
            Schema.toStandardSchemaV1(
                schema.mapFields(fields => ({ ...fields, title: Schema.Union([fields.title, Schema.Literal(persistedTitle)]) }), {
                    unsafePreserveChecks: true
                })
            )
        )
    });

    const handleSubmit = (data: TransactionCreateInputInterface) =>
        run(
            Effect.gen(function* () {
                const transactionService = yield* TransactionService;
                const brokerageService = yield* BrokerageService;
                const accountIds = [
                    transaction.fromAccountId,
                    transaction.toAccountId,
                    ...transaction.entries.map(entry => entry.accountId),
                    data.fromAccountId,
                    data.toAccountId,
                    ...data.entries.map(entry => entry.accountId)
                ].filter(isPositiveNumber);
                const fundingEffect =
                    transaction.externalSource === ExternalSourceEnum.BROKERAGE_FUNDING
                        ? brokerageService.adoptFunding(id, t(BROKERAGE_FUNDING_TITLE), accountIds)
                        : brokerageService.reconcileFunding(t(BROKERAGE_FUNDING_TITLE), accountIds);

                yield* Db.transaction(
                    transactionService.updateById(id, data).pipe(Effect.andThen(attachReceipt(receipt, id)), Effect.andThen(fundingEffect))
                );
                yield* scheduleRecurringRefresh(RecurringRefreshModeEnum.RECENT);
                onAfterSubmit?.(data);
                hapticNotification(NotificationFeedbackType.Success);
                goBackOrReplace('/');
            }).pipe(toastOnFailure(t`Could not update transaction.`))
        );

    const handleDelete = () =>
        run(
            Effect.gen(function* () {
                if (yield* deleteTransaction(id)) {
                    goBackOrReplace('/');
                }
            })
        );

    return {
        form,
        handleDelete,
        handleSubmit: form.handleSubmit(handleSubmit)
    };
};
