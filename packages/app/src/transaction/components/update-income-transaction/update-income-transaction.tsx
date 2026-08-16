import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';

import { useSimpleTransactionActionsMenu } from '../../hook/use-simple-transaction-actions-menu.hook';
import { useTransactionFeeFormActions } from '../../hook/use-transaction-fee-form-actions.hook';
import { useUpdateSimpleTransaction } from '../../hook/use-update-simple-transaction.hook';
import { buildIncomeEntry } from '../../utils/build-income-entry.util';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { UpdateSimpleTransactionPage } from '../update-simple-transaction-page/update-simple-transaction-page';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateIncomeTransaction = ({ transaction, openFeeOnMount }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const transactionId = transaction.id;
    const simpleTransaction = useUpdateSimpleTransaction({
        transaction,
        transactionId,
        schema: IncomeTransactionCreateInputSchema
    });
    const { formRef, handleFeePress } = useTransactionFeeFormActions(openFeeOnMount);

    const toAccountId = useWatch({ control: simpleTransaction.form.control, name: 'toAccountId' });
    const entries = useWatch({ control: simpleTransaction.form.control, name: 'entries' });
    const categoryEntries = getTransactionCategoryEntries(entries);
    const mccCategoryId = categoryEntries.at(0)?.mccCategoryId ?? null;
    const { actionsMenuProps, debtSettlementAccountTitle } = useSimpleTransactionActionsMenu({
        transaction,
        transactionAccountId: toAccountId,
        transactionType: TransactionTypeEnum.INCOME,
        categoryEntryCount: categoryEntries.length,
        onDelete: simpleTransaction.handleDelete,
        onFeePress: handleFeePress
    });

    return (
        <UpdateSimpleTransactionPage
            form={simpleTransaction.form}
            title={t`Edit Income`}
            onGoBack={simpleTransaction.handleGoBack}
            right={<UpdateTransactionActionsMenu {...actionsMenuProps} />}
        >
            <SimpleQuickForm
                ref={formRef}
                variant="positive"
                transactionType={TransactionTypeEnum.INCOME}
                accountFieldName="toAccountId"
                transactionTitle={transaction.title}
                mccCategoryId={mccCategoryId}
                debtSettlementAccountTitle={debtSettlementAccountTitle}
                buildEntries={buildIncomeEntry}
                onSubmit={simpleTransaction.handleSubmit}
                onCancel={simpleTransaction.handleGoBack}
                rulePillSlotProps={simpleTransaction}
                showInlineFeeAction={false}
            />
        </UpdateSimpleTransactionPage>
    );
};
