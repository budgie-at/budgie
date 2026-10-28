import { useAtomValue } from '@effect/atom-react/Hooks';
/* jscpd:ignore-start */
import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { FullPage } from '../../../@generic/component/page/full-page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { defaultAccountAtom } from '../../../settings/constants/settings-atoms.constant';
import { SimpleQuickForm } from '../../../transaction/components/simple-quick-form/simple-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';
/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function CreateIncomeTransactionPage() {
    const { t } = useLingui();
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const { markForEmbedding } = useEmbeddingGenerator();
    const { accountId } = useLocalSearchParams<{ accountId?: string | string[] }>();

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data =>
            Effect.flatMap(TransactionService, transactionService => transactionService.createInternal(data)).pipe(
                Effect.tap(result =>
                    Effect.sync(() => {
                        markForEmbedding(result.id);
                    })
                )
            ),
        schema: IncomeTransactionCreateInputSchema,
        toAccountId: parsePositiveRouteParam(accountId) ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.INCOME,
        fromAccountId: null
    });

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <FullPage header={<PageHeader title={t`New Income`} onGoBack={handleGoBack} />}>
                <SimpleQuickForm
                    transactionType={TransactionTypeEnum.INCOME}
                    isNewTransaction
                    onSubmit={handleSubmit}
                    onCancel={handleGoBack}
                />
            </FullPage>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
