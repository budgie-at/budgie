/* jscpd:ignore-start */
import { TransactionTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { TransferCreationService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';
import { FormProvider } from 'react-hook-form';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { FullPage } from '../../../@generic/component/page/full-page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { TransferQuickForm } from '../../../transaction/components/transfer-quick-form/transfer-quick-form';
import { useCreateTransactionForm } from '../../../transaction/hook/use-create-transaction-form.hook';

import type { Edge } from 'react-native-safe-area-context';
/* jscpd:ignore-end */

const SAFE_EDGES: Edge[] = ['top', 'bottom'];

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
            <FullPage header={<PageHeader title={t`New Transfer`} onGoBack={handleGoBack} />} safeEdges={SAFE_EDGES}>
                <TransferQuickForm variant="default" onSubmit={handleSubmit} onCancel={handleGoBack} />
            </FullPage>
        </FormProvider>
    );
}
/* jscpd:ignore-end */
