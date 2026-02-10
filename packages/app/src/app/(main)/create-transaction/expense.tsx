/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { SimpleQuickForm } from '../../../transaction/components/simple-quick-form/simple-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
import { transactionService } from '../../../transaction/service/transaction.service';
import { buildExpenseEntry } from '../../../transaction/utils/build-expense-entry.util';
/* jscpd:ignore-end */

const normalizeRouteParam = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

/* jscpd:ignore-start */
export default function CreateExpenseTransactionPage() {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();
    const { generateForTransaction } = useEmbeddingGenerator();
    const { accountId, categoryId, amount, comment, aiContext } = useLocalSearchParams<{
        accountId?: string | string[];
        categoryId?: string | string[];
        amount?: string | string[];
        comment?: string | string[];
        aiContext?: string | string[];
    }>();
    const normalizedAccountId = normalizeRouteParam(accountId);
    const normalizedCategoryId = normalizeRouteParam(categoryId);
    const normalizedAmount = normalizeRouteParam(amount);
    const normalizedComment = normalizeRouteParam(comment);
    const normalizedAiContext = normalizeRouteParam(aiContext);

    const parsedAccountId = isDefined(normalizedAccountId) && isPositiveNumber(Number(normalizedAccountId)) ? Number(normalizedAccountId) : null;
    const parsedCategoryId =
        isDefined(normalizedCategoryId) && isPositiveNumber(Number(normalizedCategoryId)) ? Number(normalizedCategoryId) : void 0;
    const parsedAmount = isDefined(normalizedAmount) && isPositiveNumber(Number(normalizedAmount)) ? Number(normalizedAmount) : void 0;

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: async data => {
            const start = performance.now();
            console.log('[Expense] onSubmit START'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            const result = await transactionService.createInternal(data);
            console.log(`[Expense] createInternal done in ${(performance.now() - start).toFixed(0)}ms`); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            generateForTransaction(data.title, data.comment, data.entries[0]?.mccCategoryId ?? null);
            console.log(`[Expense] generateForTransaction fired in ${(performance.now() - start).toFixed(0)}ms`); // eslint-disable-line no-console, lingui/no-unlocalized-strings

            return result;
        },
        schema: ExpenseTransactionCreateInputSchema,
        fromAccountId: parsedAccountId ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null,
        amount: parsedAmount,
        categoryId: parsedCategoryId,
        comment: normalizedComment
    });

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <FullPage header={<PageHeader title={t`New Expense`} onGoBack={handleGoBack} />}>
                <SimpleQuickForm
                    variant="destructive"
                    transactionType={TransactionTypeEnum.EXPENSE}
                    accountFieldName="fromAccountId"
                    transactionTitle=""
                    mccCategoryId={null}
                    aiContext={normalizedAiContext}
                    isNewTransaction
                    buildEntries={buildExpenseEntry}
                    onSubmit={handleSubmit}
                    onCancel={handleGoBack}
                />
            </FullPage>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
