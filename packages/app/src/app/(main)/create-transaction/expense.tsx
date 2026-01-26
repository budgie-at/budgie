/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';
import { z } from 'zod';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionQuickForm } from '../../../transaction/components/transaction-quick-form/transaction-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
import { transactionService } from '../../../transaction/service/transaction.service';
/* jscpd:ignore-end */

const EntryParamSchema = z.object({
    categoryId: z.number(),
    amount: z.number()
});

type EntryParamInterface = z.infer<typeof EntryParamSchema>;

const EntriesParamSchema = z.array(EntryParamSchema);

const parseEntriesParam = (entriesParam: string): EntryParamInterface[] | null => {
    try {
        const parsed = EntriesParamSchema.safeParse(JSON.parse(entriesParam));

        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
};

/* jscpd:ignore-start */
export default function CreateExpenseTransactionPage() {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();
    const { accountId, categoryId, amount, comment, entries } = useLocalSearchParams<{
        accountId?: string;
        categoryId?: string;
        amount?: string;
        comment?: string;
        entries?: string;
    }>();

    const parsedAccountId = isDefined(accountId) && isPositiveNumber(Number(accountId)) ? Number(accountId) : null;
    const parsedCategoryId = isDefined(categoryId) && isPositiveNumber(Number(categoryId)) ? Number(categoryId) : void 0;
    const parsedAmount = isDefined(amount) && isPositiveNumber(Number(amount)) ? Number(amount) : void 0;
    const parsedEntries = isDefined(entries) ? parseEntriesParam(entries) : null;

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternal(data),
        schema: ExpenseTransactionCreateInputSchema,
        fromAccountId: parsedAccountId ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.EXPENSE,
        toAccountId: null,
        amount: parsedAmount,
        categoryId: parsedCategoryId,
        comment,
        entries: parsedEntries
    });

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <Page header={<PageHeader title={t`New Expense`} onGoBack={handleGoBack} />}>
                <TransactionQuickForm variant="destructive" transactionType={TransactionTypeEnum.EXPENSE} onSubmit={handleSubmit} />
            </Page>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
