import { TransactionTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { TransactionTransferService, buildTransferEntries, createTransactionInput, getTransactionFeeEntries } from '@budgie/ledger';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { router } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { PageHeader } from '../@generic/component/page-header/page-header';
import { ModalPage } from '../@generic/component/page/modal-page';
import { appRuntime } from '../@generic/runtime/app.runtime';
import { confirmAlert } from '../@generic/utils/confirm-alert/confirm-alert.util';
import { TransferQuickForm } from '../transaction/components/transfer-quick-form/transfer-quick-form';
import { useConvertToTransferModal, useConvertToTransferModalParams } from '../transaction/context/convert-to-transfer-modal.context';

import { ConvertToTransferModalSelector } from './convert-to-transfer-modal.selector';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

// eslint-disable-next-line max-statements, max-lines-per-function -- Form orchestration component with multiple hooks and handlers
export default function ConvertToTransferModal() {
    const { t } = useLingui();
    const [, resolveConvertToTransfer] = useConvertToTransferModal();
    const currentParams = useConvertToTransferModalParams();

    const transactionId = currentParams?.transactionId ?? 0;
    const transactionType = currentParams?.transactionType ?? TransactionTypeEnum.EXPENSE;
    const excludeAccountId = currentParams?.excludeAccountId ?? 0;
    const sourceAmount = currentParams?.sourceAmount ?? 0;
    const skipPostConvertNavigation = currentParams?.skipPostConvertNavigation === true;

    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;
    const colorVariant = isExpense ? 'default' : 'positive';

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

    const description = isExpense
        ? t`This will convert the expense to a transfer between accounts.`
        : t`This will convert the income to a transfer between accounts.`;

    const handleCancel = () => {
        resolveConvertToTransfer(false);
    };

    // eslint-disable-next-line max-statements -- Conversion flow with confirmation dialog and error handling
    const handleSubmit = async () => {
        const confirmed = await confirmAlert({
            title: t`Convert to Transfer?`,
            message: description,
            confirmText: t`Convert`,
            cancelText: t`Cancel`,
            isDestructive: false
        });

        if (!confirmed) {
            return;
        }

        try {
            const formValues = form.getValues();
            const selectedAccountId = isExpense ? (formValues.toAccountId ?? 0) : (formValues.fromAccountId ?? 0);
            const customRate = formValues.exchangeRate === 1 ? 0 : formValues.exchangeRate;
            const convertParams = {
                id: transactionId,
                accountId: selectedAccountId,
                customExchangeRate: customRate,
                feeEntries: getTransactionFeeEntries(formValues.entries)
            };

            await appRuntime.runPromise(
                Effect.flatMap(TransactionTransferService, transactionTransferService =>
                    isExpense
                        ? transactionTransferService.convertExpenseToTransfer(convertParams)
                        : transactionTransferService.convertIncomeToTransfer(convertParams)
                )
            );

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
        } catch {
            Toast.show({ type: 'error', text1: t`Conversion failed`, text2: t`Please try again` });
        }
    };

    return (
        <FormProvider {...form}>
            <ModalPage
                testID={ConvertToTransferModalSelector.Page}
                header={<PageHeader title={t`Convert to Transfer`} onGoBack={handleCancel} />}
            >
                <TransferQuickForm variant={colorVariant} onSubmit={handleSubmit} onCancel={handleCancel} />
            </ModalPage>
        </FormProvider>
    );
}
