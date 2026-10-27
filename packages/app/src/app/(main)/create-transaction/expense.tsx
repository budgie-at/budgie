import { useAtomValue } from '@effect/atom-react/Hooks';
/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { FullPage } from '../../../@generic/component/page/full-page';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { normalizeRouteParam } from '../../../@generic/utils/normalize-route-param.util';
import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { defaultAccountAtom } from '../../../settings/constants/settings-atoms.constant';
import { SimpleQuickForm } from '../../../transaction/components/simple-quick-form/simple-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function CreateExpenseTransactionPage() {
    const { t } = useLingui();
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const { accountId, categoryId, amount, comment, aiContext } = useLocalSearchParams<{
        accountId?: string | string[];
        categoryId?: string | string[];
        amount?: string | string[];
        comment?: string | string[];
        aiContext?: string | string[];
    }>();
    const normalizedComment = normalizeRouteParam(comment);
    const normalizedAiContext = normalizeRouteParam(aiContext);

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data =>
            appRuntime.runPromise(Effect.flatMap(TransactionService, transactionService => transactionService.createInternal(data))),
        schema: ExpenseTransactionCreateInputSchema,
        fromAccountId: parsePositiveRouteParam(accountId) ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null,
        amount: parsePositiveRouteParam(amount) ?? void 0,
        categoryId: parsePositiveRouteParam(categoryId) ?? void 0,
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
                    onSubmit={handleSubmit}
                    onCancel={handleGoBack}
                />
            </FullPage>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
