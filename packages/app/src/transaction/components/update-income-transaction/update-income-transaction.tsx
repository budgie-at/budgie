import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useUpdateSimpleTransaction } from '../../hook/use-update-simple-transaction.hook';
import { buildIncomeEntry } from '../../utils/build-income-entry.util';
import { SimpleQuickForm } from '../simple-quick-form/simple-quick-form';
import { UpdateSimpleTransactionPage } from '../update-simple-transaction-page/update-simple-transaction-page';
import { UpdateTransactionActionsMenu } from '../update-transaction-actions-menu/update-transaction-actions-menu';

import type { UpdateTransactionFormPropsInterface } from '../../interface/update-transaction-form-props.interface';

export const UpdateIncomeTransaction = ({ transaction, openFeeOnMount }: UpdateTransactionFormPropsInterface) => {
    const { t } = useLingui();
    const { formRef, ...simpleTransaction } = useUpdateSimpleTransaction({
        transaction,
        transactionType: TransactionTypeEnum.INCOME,
        openFeeOnMount
    });

    return (
        <UpdateSimpleTransactionPage
            form={simpleTransaction.form}
            title={t`Edit Income`}
            onGoBack={simpleTransaction.handleGoBack}
            right={<UpdateTransactionActionsMenu {...simpleTransaction.actionsMenuProps} />}
        >
            <SimpleQuickForm
                ref={formRef}
                variant="positive"
                transactionType={TransactionTypeEnum.INCOME}
                accountFieldName="toAccountId"
                transactionTitle={transaction.title}
                mccCategoryId={simpleTransaction.mccCategoryId}
                debtSettlementAccount={simpleTransaction.debtSettlementAccount}
                buildEntries={buildIncomeEntry}
                onSubmit={simpleTransaction.handleSubmit}
                onCancel={simpleTransaction.handleGoBack}
                rulePillSlotProps={simpleTransaction}
                showInlineFeeAction={false}
            />
        </UpdateSimpleTransactionPage>
    );
};
