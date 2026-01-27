/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ExpenseQuickForm } from '../../../transaction/components/expense-quick-form/expense-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
import { transactionService } from '../../../transaction/service/transaction.service';

import type { Edge } from 'react-native-safe-area-context';
/* jscpd:ignore-end */

const SAFE_EDGES: Edge[] = ['top', 'bottom'];

/* jscpd:ignore-start */
export default function CreateExpenseTransactionPage() {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();
    const { accountId, categoryId, amount, comment } = useLocalSearchParams<{
        accountId?: string;
        categoryId?: string;
        amount?: string;
        comment?: string;
    }>();

    const parsedAccountId = isDefined(accountId) && isPositiveNumber(Number(accountId)) ? Number(accountId) : null;
    const parsedCategoryId = isDefined(categoryId) && isPositiveNumber(Number(categoryId)) ? Number(categoryId) : void 0;
    const parsedAmount = isDefined(amount) && isPositiveNumber(Number(amount)) ? Number(amount) : void 0;

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternal(data),
        schema: ExpenseTransactionCreateInputSchema,
        fromAccountId: parsedAccountId ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null,
        amount: parsedAmount,
        categoryId: parsedCategoryId,
        comment
    });

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <Page header={<PageHeader title={t`New Expense`} onGoBack={handleGoBack} />} safeEdges={SAFE_EDGES}>
                <ExpenseQuickForm variant="destructive" onSubmit={handleSubmit} />
            </Page>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
