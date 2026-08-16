import { AccountTypeEnum, TransactionEntryTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { FullPage } from '../../../@generic/component/page/full-page';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useAccountBalanceQuery } from '../../../account/query/use-account-balance.query';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { useConsolidationSourceModal } from '../../context/consolidation-source-modal.context';
import { useOpenTransactionFeeFromSearchParams } from '../../hook/use-open-transaction-fee-from-search-params.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useUpdateTransactionForm } from '../../hook/use-update-transaction-form.hook';
import { convertTransactionToInput } from '../../utils/convert-transaction-to-input.util';
import { TransferQuickForm } from '../transfer-quick-form/transfer-quick-form';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateTransferTransaction = ({ transaction }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const { handleFeePress, setFormRef } = useOpenTransactionFeeFromSearchParams();
    const { markForEmbedding } = useEmbeddingGenerator();
    const [openConsolidationSource] = useConsolidationSourceModal();

    const initialDestinationAmount = convertFromMicroUnits(
        transaction.entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT)?.amount ?? 0
    );
    const isConsolidated = isDefined(transaction.consolidationType);
    const handleRevert = useRevertConsolidation(transaction.id, () => void dismissAllOrReplace('/'));

    const { form, handleSubmit, handleDelete } = useUpdateTransactionForm({
        transaction: convertTransactionToInput(transaction),
        schema: TransferTransactionCreateInputSchema,
        id: transaction.id,
        onAfterSubmit: () => void markForEmbedding(transaction.id)
    });

    const [fromAccountId, amount] = useWatch({
        control: form.control,
        name: ['fromAccountId', 'amount']
    });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const { balance } = useAccountBalanceQuery(fromAccountId ?? 0);

    const handleGoBack = () => void goBackOrReplace('/');
    useEffect(() => {
        if (account?.type === AccountTypeEnum.DEBT && amount > balance) {
            form.setError('amount', { type: 'custom', message: t`Amount exceeds debt account balance` });
        } else {
            form.clearErrors('amount');
        }
    }, [account?.type, amount, balance, form, t]);

    return (
        <FormProvider {...form}>
            <FullPage
                header={
                    <PageHeader
                        title={t`Edit Transfer`}
                        onGoBack={handleGoBack}
                        right={
                            <UpdateTransactionActionsMenu
                                onDelete={handleDelete}
                                isConsolidated={isConsolidated}
                                onRevert={handleRevert}
                                onFeePress={handleFeePress}
                            />
                        }
                    />
                }
            >
                <TransferQuickForm
                    ref={setFormRef}
                    variant="default"
                    initialDestinationAmount={initialDestinationAmount}
                    onSubmit={handleSubmit}
                    onCancel={handleGoBack}
                    showInlineFeeAction={false}
                    {...(isConsolidated && { onConsolidationPress: () => void openConsolidationSource({ transactionId: transaction.id }) })}
                />
            </FullPage>
        </FormProvider>
    );
};
