/* jscpd:ignore-start */
import { TransactionTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';

import { ModalPage } from '../@generic/component/page/modal-page';
import { PageHeader } from '../@generic/component/page-header/page-header';
import { confirmAlert } from '../@generic/utils/confirm-alert/confirm-alert.util';
import { SystemCategoryIdEnum } from '../category/enum/system-category-id.enum';
import { TransferQuickForm } from '../transaction/components/transfer-quick-form/transfer-quick-form';
import { useConvertToTransferModal } from '../transaction/context/convert-to-transfer-modal.context';
import { useConvertExpenseToTransferMutation } from '../transaction/hooks/use-convert-expense-to-transfer.mutation';
import { useConvertIncomeToTransferMutation } from '../transaction/hooks/use-convert-income-to-transfer.mutation';
import { buildTransferEntries } from '../transaction/utils/build-transfer-entries.util';
import { createTransactionInput } from '../transaction/utils/create-transaction-input.util';

import { ConvertToTransferModalSelector } from './convert-to-transfer-modal.selector';

import type { TransactionCreateInputInterface } from '@budgie/contracts';
/* jscpd:ignore-end */

// eslint-disable-next-line max-statements, max-lines-per-function -- Form orchestration component with multiple hooks and handlers
export default function ConvertToTransferModal() {
    const { t } = useLingui();
    const [, resolveConvertToTransfer, currentParams] = useConvertToTransferModal();

    const convertExpenseMutation = useConvertExpenseToTransferMutation();
    const convertIncomeMutation = useConvertIncomeToTransferMutation();

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
        resolver: zodResolver(TransferTransactionCreateInputSchema),
        defaultValues: createTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            amount: sourceAmount,
            type: TransactionTypeEnum.TRANSFER,
            entries: buildTransferEntries({
                fromAccountId,
                toAccountId,
                amount: sourceAmount,
                categoryId: SystemCategoryIdEnum.CURRENCY_TRANSFER
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
            const convertParams = { id: transactionId, accountId: selectedAccountId, customExchangeRate: customRate };

            if (isExpense) {
                await convertExpenseMutation(convertParams);
            } else {
                await convertIncomeMutation(convertParams);
            }

            if (skipPostConvertNavigation) {
                resolveConvertToTransfer(true);
            } else {
                resolveConvertToTransfer(true, { skipBack: true });
                const transferRoute = `/transactions/${transactionId}/transfer` as const;

                if (router.canDismiss()) {
                    router.dismiss();
                }
                if (router.canGoBack()) {
                    router.back();
                }

                router.push(transferRoute);
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
