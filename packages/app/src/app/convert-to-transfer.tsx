import { TransactionTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { TransactionTransferService, buildTransferEntries, createTransactionInput, getTransactionFeeEntries } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { router } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useSingleFlight } from '../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../@generic/utils/toast-on-failure.util';
import { ConvertTransferForm } from '../transaction/components/convert-transfer-form/convert-transfer-form';
import { useConvertToTransferModal } from '../transaction/context/convert-to-transfer-modal.context';
import { useConvertToTransferModalParams } from '../transaction/hook/use-convert-to-transfer-modal-params.hook';

import { ConvertToTransferModalSelector } from './convert-to-transfer-modal.selector';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export default function ConvertToTransferModal() {
    const { t } = useLingui();
    const [, resolveConvertToTransfer, dismissConvertToTransfer] = useConvertToTransferModal();
    useModalDismiss(dismissConvertToTransfer);
    const currentParams = useConvertToTransferModalParams();
    const { isLoading, run } = useSingleFlight();

    const transactionId = currentParams?.transactionId ?? 0;
    const transactionType = currentParams?.transactionType ?? TransactionTypeEnum.EXPENSE;
    const excludeAccountId = currentParams?.excludeAccountId ?? 0;
    const sourceAmount = currentParams?.sourceAmount ?? 0;
    const skipPostConvertNavigation = currentParams?.skipPostConvertNavigation === true;

    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;

    const fromAccountId = isExpense ? excludeAccountId : 0;
    const toAccountId = isExpense ? 0 : excludeAccountId;

    const form = useForm<TransactionCreateInputInterface>({
        mode: 'onSubmit',
        resolver: standardSchemaResolver(Schema.toStandardSchemaV1(TransferTransactionCreateInputSchema)),
        defaultValues: createTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            amount: sourceAmount,
            type: TransactionTypeEnum.TRANSFER,
            entries: buildTransferEntries({
                fromAccountId,
                toAccountId,
                amount: sourceAmount
            })
        })
    });

    const handleCancel = () => {
        resolveConvertToTransfer(false);
    };

    const handleSubmit = () =>
        run(
            Effect.gen(function* () {
                const formValues = form.getValues();
                const convertParams = {
                    id: transactionId,
                    accountId: isExpense ? (formValues.toAccountId ?? 0) : (formValues.fromAccountId ?? 0),
                    customExchangeRate: formValues.exchangeRate === 1 ? 0 : formValues.exchangeRate,
                    feeEntries: getTransactionFeeEntries(formValues.entries)
                };
                const transactionTransferService = yield* TransactionTransferService;

                yield* isExpense
                    ? transactionTransferService.convertExpenseToTransfer(convertParams)
                    : transactionTransferService.convertIncomeToTransfer(convertParams);

                if (skipPostConvertNavigation) {
                    resolveConvertToTransfer(true);
                } else {
                    resolveConvertToTransfer(true, { skipBack: true });
                    if (router.canDismiss()) {
                        router.dismiss();
                    }
                    if (router.canGoBack()) {
                        router.back();
                    }

                    router.push({ pathname: '/transactions/[id]/transfer', params: { id: String(transactionId) } });
                }
            }).pipe(toastOnFailure(t`Conversion failed`, t`Please try again`))
        );

    return (
        <FormProvider {...form}>
            <View collapsable={false} testID={ConvertToTransferModalSelector.Page}>
                <ConvertTransferForm isSubmitting={isLoading} onSubmit={handleSubmit} onCancel={handleCancel} />
            </View>
        </FormProvider>
    );
}
