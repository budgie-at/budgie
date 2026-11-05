/* jscpd:ignore-start */
import { TransactionTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { TransferCreationService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { TransactionFormScreen } from '../../../transaction/components/transaction-form-screen/transaction-form-screen';
import { TransferQuickForm } from '../../../transaction/components/transfer-quick-form/transfer-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';

/* jscpd:ignore-end */

/* jscpd:ignore-start */
export default function CreateTransferTransactionPage() {
    const { t } = useLingui();
    const { markForEmbedding } = useEmbeddingGenerator();
    const { accountId, toAccountId } = useLocalSearchParams<{ accountId?: string | string[]; toAccountId?: string | string[] }>();

    const { form, handleSubmit } = useCreateTransactionForm({
        onSubmit: data =>
            Effect.flatMap(TransferCreationService, transferCreationService => transferCreationService.createInternalTransfer(data)).pipe(
                Effect.tap(result =>
                    Effect.sync(() => {
                        markForEmbedding(result.id);
                    })
                )
            ),
        schema: TransferTransactionCreateInputSchema,
        type: TransactionTypeEnum.TRANSFER,
        fromAccountId: parsePositiveRouteParam(accountId) ?? 0,
        toAccountId: parsePositiveRouteParam(toAccountId) ?? 0
    });

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <FormProvider {...form}>
            <TransactionFormScreen title={t`New Transfer`} onGoBack={handleGoBack}>
                <TransferQuickForm variant="default" onSubmit={handleSubmit} />
            </TransactionFormScreen>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
