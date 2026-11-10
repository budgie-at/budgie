import { Db, ExternalSourceEnum, TransactionCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';
import { createTransactionInput } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { NotificationFeedbackType } from 'expo-haptics';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { attachReceipt } from '../../receipt/utils/attach-receipt.util';
import { RecurringRefreshModeEnum } from '../../recurring/enum/recurring-refresh-mode.enum';
import { scheduleRecurringRefresh } from '../../recurring/utils/schedule-recurring-refresh.util';
import { buildPrimaryEntry } from '../utils/build-primary-entry.util';

import type { CreateTransactionFormConfigInterface } from '../interface/create-transaction-form-config.interface';

export const useCreateTransactionForm = ({
    type,
    schema,
    onSubmit,
    receipt = null,
    fromAccountId,
    toAccountId,
    amount = 0,
    categoryId = 0,
    comment = '',
    title = '',
    operatedAt
}: CreateTransactionFormConfigInterface) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();
    const [hapticNotification] = useVibration();

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

    const persist = (data: TransactionCreateInputInterface) =>
        isDefined(receipt)
            ? Db.transaction(
                  Effect.tap(
                      onSubmit({ ...data, externalId: receipt.fingerprint, externalSource: ExternalSourceEnum.RECEIPT }),
                      transaction => attachReceipt(receipt, transaction.id)
                  )
              )
            : onSubmit(data);

    const handleSubmit = (data: TransactionCreateInputInterface) =>
        run(
            persist(data).pipe(
                Effect.tap(() => scheduleRecurringRefresh(RecurringRefreshModeEnum.RECENT)),
                Effect.tap(() =>
                    Effect.sync(() => {
                        hapticNotification(NotificationFeedbackType.Success);
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
