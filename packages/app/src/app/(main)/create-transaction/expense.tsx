/* jscpd:ignore-start */
import { ExpenseTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { BlurScrollView } from '../../../@generic/component/blur-scroll-view/blur-scroll-view';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TransactionFormAccountSelector } from '../../../transaction/components/transaction-form-account-selector/transaction-form-account-selector';
import { TransactionFormAmount } from '../../../transaction/components/transaction-form-amount/transaction-form-amount';
import { TransactionFormCategory } from '../../../transaction/components/transaction-form-category/transaction-form-category';
import { TransactionFormComment } from '../../../transaction/components/transaction-form-comment/transaction-form-comment';
import { TransactionFormDateField } from '../../../transaction/components/transaction-form-date-field/transaction-form-date-field';
import { TransactionFormFooter } from '../../../transaction/components/transaction-form-footer/transaction-form-footer';
import { TransactionFormTagsField } from '../../../transaction/components/transaction-form-tags-field/transaction-form-tags-field';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
import { transactionService } from '../../../transaction/service/transaction.service';
/* jscpd:ignore-end */

interface EntryParamInterface {
    categoryId: number;
    amount: number;
}

const isValidEntry = (item: unknown): item is EntryParamInterface =>
    typeof item === 'object' &&
    item !== null &&
    'categoryId' in item &&
    'amount' in item &&
    typeof item.categoryId === 'number' &&
    typeof item.amount === 'number';

const parseEntriesParam = (entriesParam: string): EntryParamInterface[] | null => {
    try {
        const parsed = JSON.parse(entriesParam) as unknown;
        if (Array.isArray(parsed)) {
            return parsed.filter(isValidEntry);
        }
    } catch {
        return null;
    }

    return null;
};

/* jscpd:ignore-start */
export default function CreateExpenseTransactionPage() {
    const { t } = useLingui();
    const { defaultAccount, defaultInstrument } = useSettingsContext();
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

    const fromAccountId = useWatch({ control: form.control, name: 'fromAccountId' });
    const { account } = useGetAccountByIdQuery(fromAccountId ?? 0);
    const instrumentSymbol = account?.instrument.symbol ?? defaultInstrument.symbol;

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <Page
                header={<PageHeader title={t`New Expense`} onGoBack={handleGoBack} />}
                footer={<TransactionFormFooter variant="destructive" buttonText={t`Add Expense`} onSubmit={handleSubmit} />}
                withBlur
            >
                <BlurScrollView>
                    <TransactionFormAmount instrumentSymbol={instrumentSymbol} variant="destructive" autoFocus />

                    <FormLayoutGroup>
                        <TransactionFormAccountSelector variant="destructive" fieldName="fromAccountId" />

                        <TransactionFormCategory
                            transactionType={TransactionTypeEnum.EXPENSE}
                            accountId={fromAccountId ?? 0}
                            variant="destructive"
                        />

                        <FormLayoutGroup variant="horizontal">
                            <TransactionFormDateField variant="destructive" />
                            <TransactionFormTagsField variant="destructive" />
                        </FormLayoutGroup>

                        <TransactionFormComment />
                    </FormLayoutGroup>
                </BlurScrollView>
            </Page>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
