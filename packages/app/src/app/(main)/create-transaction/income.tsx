/* jscpd:ignore-start */
import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FullPage } from '../../../@generic/component/page/full-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { IncomeQuickForm } from '../../../transaction/components/income-quick-form/income-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
import { transactionService } from '../../../transaction/service/transaction.service';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function CreateIncomeTransactionPage() {
    const { t } = useLingui();
    const { defaultAccount } = useSettingsContext();
    const { accountId } = useLocalSearchParams<{ accountId?: string }>();

    const parsedAccountId = isDefined(accountId) && isPositiveNumber(Number(accountId)) ? Number(accountId) : null;

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data => transactionService.createInternal(data),
        schema: IncomeTransactionCreateInputSchema,
        toAccountId: parsedAccountId ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.INCOME,
        fromAccountId: null
    });

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <FullPage header={<PageHeader title={t`New Income`} onGoBack={handleGoBack} />}>
                <IncomeQuickForm variant="positive" onSubmit={handleSubmit} />
            </FullPage>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
