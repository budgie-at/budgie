import { TransactionTypeEnum, TransferTransactionCreateInputSchema } from '@budgie/contracts';
import { TransferCreationService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';

import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { CreateTransactionScreen } from '../../../transaction/components/create-transaction-screen/create-transaction-screen';
import { TransferQuickForm } from '../../../transaction/components/transfer-quick-form/transfer-quick-form';

import type { CreateTransactionFormConfigInterface } from '../../../transaction/interface/create-transaction-form-config.interface';

export default function CreateTransferTransactionPage() {
    const { t } = useLingui();
    const { accountId, toAccountId } = useLocalSearchParams<{ accountId?: string | string[]; toAccountId?: string | string[] }>();

    const config: CreateTransactionFormConfigInterface = {
        onSubmit: data =>
            Effect.flatMap(TransferCreationService, transferCreationService => transferCreationService.createInternalTransfer(data)),
        schema: TransferTransactionCreateInputSchema,
        type: TransactionTypeEnum.TRANSFER,
        fromAccountId: parsePositiveRouteParam(accountId) ?? 0,
        toAccountId: parsePositiveRouteParam(toAccountId) ?? 0
    };

    return (
        <CreateTransactionScreen title={t`New Transfer`} config={config}>
            {handleSubmit => <TransferQuickForm variant="default" onSubmit={handleSubmit} />}
        </CreateTransactionScreen>
    );
}
