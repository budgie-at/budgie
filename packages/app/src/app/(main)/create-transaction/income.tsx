/* jscpd:ignore-start */
import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
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
import { buildIncomeEntry } from '../../../transaction/utils/build-income-entry.util';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function CreateIncomeTransactionPage() {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();
    const { generateForTransaction } = useEmbeddingGenerator();
    const { accountId } = useLocalSearchParams<{ accountId?: string }>();

    const parsedAccountId = isDefined(accountId) && isPositiveNumber(Number(accountId)) ? Number(accountId) : null;

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: async data => {
            const result = await transactionService.createInternal(data);
            generateForTransaction({
                title: data.title,
                comment: data.comment,
                mccCategoryId: data.entries[0]?.mccCategoryId ?? null,
                categoryId: data.entries[0]?.categoryId ?? null,
                tagIds: data.tagIds
            });

            return result;
        },
        schema: IncomeTransactionCreateInputSchema,
        toAccountId: parsedAccountId ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.INCOME,
        fromAccountId: null
    });

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <FullPage header={<PageHeader title={t`New Income`} onGoBack={handleGoBack} />}>
                <SimpleQuickForm
                    variant="positive"
                    transactionType={TransactionTypeEnum.INCOME}
                    accountFieldName="toAccountId"
                    transactionTitle=""
                    mccCategoryId={null}
                    isNewTransaction
                    buildEntries={buildIncomeEntry}
                    onSubmit={handleSubmit}
                    onCancel={handleGoBack}
                />
            </FullPage>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
