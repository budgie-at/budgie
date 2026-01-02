import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCreateTransactionForm } from '../../hook/use-create-transaction-form.hook';
import { transactionService } from '../../service/transaction.service';
import { LiabilityTransactionForm } from '../liability-transaction-form/liability-transaction-form';

interface Props {
    readonly categoryId?: number;
    readonly amount?: number;
    readonly accountId?: number | null;
}
export const CreateExpenseTransaction = ({ categoryId, amount, accountId }: Props) => {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternal(data),
        schema: ExpenseTransactionCreateInputSchema,
        fromAccountId: accountId ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null,
        amount,
        categoryId
    });

    useEffect(() => {
        if (isPositiveNumber(amount)) {
            form.setValue('amount', amount);
        }
    }, [amount, form]);

    useEffect(() => {
        if (isPositiveNumber(categoryId)) {
            form.setValue('entries.0.categoryId', categoryId);
        }
    }, [categoryId, form]);

    return (
        <LiabilityTransactionForm
            accountFieldName="fromAccountId"
            control={form.control}
            onSubmit={handleSubmit}
            setValue={form.setValue}
            variant="destructive"
            icon={UserIconNameEnum.TrendingDown}
            title={t`New Expense`}
            buttonText={t`Add Expense`}
            transactionType={TransactionTypeEnum.EXPENSE}
        />
    );
};
