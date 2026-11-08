import { TransactionTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { TransactionTransferService, buildTransferEntries, createTransactionInput, getTransactionFeeEntries } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { router } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { useSingleFlight } from '../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../@generic/utils/toast-on-failure.util';
import { ConvertToTransferModalContent } from '../transaction/components/convert-to-transfer-modal-content/convert-to-transfer-modal-content';
import { useConvertToTransferModal } from '../transaction/context/convert-to-transfer-modal.context';
import { useConvertToTransferModalParams } from '../transaction/hook/use-convert-to-transfer-modal-params.hook';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export default function ConvertToTransferModal() {
    const { t } = useLingui();
    const [, resolveConvertToTransfer, dismissConvertToTransfer] = useConvertToTransferModal();
    const currentParams = useConvertToTransferModalParams();
    useModalRouteState(currentParams, dismissConvertToTransfer);
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

    const handleConverted = (shouldSkipPostConvertNavigation: boolean) => {
        if (shouldSkipPostConvertNavigation) {
            resolveConvertToTransfer(true);

            return;
        }

        resolveConvertToTransfer(true, { skipBack: true });
        if (router.canDismiss()) {
            router.dismiss();
        }
        if (router.canGoBack()) {
            router.back();
        }

        router.push({ pathname: '/transactions/[id]/transfer', params: { id: String(transactionId) } });
    };

    const { handleCommit, handleDismissed } = useMorphingSheetResult<boolean>(handleConverted);

    const handleSubmit = (onConverted: () => void) =>
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

                handleCommit(skipPostConvertNavigation);
                onConverted();
            }).pipe(toastOnFailure(t`Conversion failed`, t`Please try again`))
        );

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <FormProvider {...form}>
            <ConvertToTransferModalContent isSubmitting={isLoading} onSubmit={handleSubmit} onDismiss={handleDismissed} />
        </FormProvider>
    );
}
