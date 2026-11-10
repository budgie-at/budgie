import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';

import { normalizeRouteParam } from '../../../@generic/utils/normalize-route-param.util';
import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { usePendingReceipt } from '../../../receipt/hook/use-pending-receipt.hook';
import { defaultAccountAtom } from '../../../settings/constants/settings-atoms.constant';
import { CreateTransactionScreen } from '../../../transaction/components/create-transaction-screen/create-transaction-screen';
import { SimpleQuickForm } from '../../../transaction/components/simple-quick-form/simple-quick-form';

import type { CreateTransactionFormConfigInterface } from '../../../transaction/interface/create-transaction-form-config.interface';

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
    const parsedOperatedAt = new Date(normalizeRouteParam(operatedAt) ?? Number.NaN);

    const config: CreateTransactionFormConfigInterface = {
        onSubmit: data => Effect.flatMap(TransactionService, transactionService => transactionService.createInternal(data)),
        schema: ExpenseTransactionCreateInputSchema,
        receipt: pendingReceipt?.receipt ?? null,
        fromAccountId: parsePositiveRouteParam(accountId) ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null,
        amount: parsePositiveRouteParam(amount) ?? void 0,
        categoryId: parsePositiveRouteParam(categoryId) ?? void 0,
        comment: normalizeRouteParam(comment),
        title: normalizeRouteParam(title),
        ...(Number.isNaN(parsedOperatedAt.getTime()) ? {} : { operatedAt: parsedOperatedAt })
    };

    return (
        <CreateTransactionScreen title={t`New Expense`} config={config}>
            {handleSubmit => (
                <SimpleQuickForm
                    transactionType={TransactionTypeEnum.EXPENSE}
                    aiContext={normalizeRouteParam(aiContext)}
                    isNewTransaction
                    onSubmit={handleSubmit}
                />
            )}
        </CreateTransactionScreen>
    );
}
