import { useAtomValue } from '@effect/atom-react/Hooks';
/* jscpd:ignore-start */
import { Db, ExpenseTransactionCreateInputSchema, ExternalSourceEnum, TransactionTypeEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { FullPage } from '../../../@generic/component/page/full-page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { normalizeRouteParam } from '../../../@generic/utils/normalize-route-param.util';
import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { usePendingReceipt } from '../../../receipt/hook/use-pending-receipt.hook';
import { attachReceipt } from '../../../receipt/utils/attach-receipt.util';
import { defaultAccountAtom } from '../../../settings/constants/settings-atoms.constant';
import { SimpleQuickForm } from '../../../transaction/components/simple-quick-form/simple-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function CreateExpenseTransactionPage() {
    const { t } = useLingui();
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const pendingReceipt = usePendingReceipt();
    const { accountId, categoryId, amount, comment, aiContext, title, operatedAt } = useLocalSearchParams<{
        accountId?: string | string[];
        categoryId?: string | string[];
        amount?: string | string[];
        comment?: string | string[];
        aiContext?: string | string[];
        title?: string | string[];
        operatedAt?: string | string[];
    }>();
    const normalizedComment = normalizeRouteParam(comment);
    const normalizedAiContext = normalizeRouteParam(aiContext);
    const parsedOperatedAt = new Date(normalizeRouteParam(operatedAt) ?? Number.NaN);

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data =>
            Db.transaction(
                Effect.gen(function* () {
                    const transactionService = yield* TransactionService;
                    const receipt = pendingReceipt?.receipt ?? null;
                    const transaction = yield* transactionService.createInternal(
                        isDefined(receipt) ? { ...data, externalId: receipt.fingerprint, externalSource: ExternalSourceEnum.RECEIPT } : data
                    );

                    yield* attachReceipt(receipt, transaction.id);

                    return transaction;
                })
            ),
        schema: ExpenseTransactionCreateInputSchema,
        fromAccountId: parsePositiveRouteParam(accountId) ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null,
        amount: parsePositiveRouteParam(amount) ?? void 0,
        categoryId: parsePositiveRouteParam(categoryId) ?? void 0,
        comment: normalizedComment,
        title: normalizeRouteParam(title),
        ...(Number.isNaN(parsedOperatedAt.getTime()) ? {} : { operatedAt: parsedOperatedAt })
    });

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <FullPage header={<PageHeader title={t`New Expense`} onGoBack={handleGoBack} />}>
                <SimpleQuickForm
                    transactionType={TransactionTypeEnum.EXPENSE}
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
