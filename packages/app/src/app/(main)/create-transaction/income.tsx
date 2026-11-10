import { IncomeTransactionCreateInputSchema, TransactionTypeEnum } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';

import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { defaultAccountAtom } from '../../../settings/constants/settings-atoms.constant';
import { CreateTransactionScreen } from '../../../transaction/components/create-transaction-screen/create-transaction-screen';
import { SimpleQuickForm } from '../../../transaction/components/simple-quick-form/simple-quick-form';

import type { CreateTransactionFormConfigInterface } from '../../../transaction/interface/create-transaction-form-config.interface';

export default function CreateIncomeTransactionPage() {
    const { t } = useLingui();
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const { accountId } = useLocalSearchParams<{ accountId?: string | string[] }>();

    const config: CreateTransactionFormConfigInterface = {
        onSubmit: data => Effect.flatMap(TransactionService, transactionService => transactionService.createInternal(data)),
        schema: IncomeTransactionCreateInputSchema,
        toAccountId: parsePositiveRouteParam(accountId) ?? defaultAccount?.id ?? 0,
        type: TransactionTypeEnum.INCOME,
        fromAccountId: null
    };

    return (
        <CreateTransactionScreen title={t`New Income`} config={config}>
            {handleSubmit => <SimpleQuickForm transactionType={TransactionTypeEnum.INCOME} isNewTransaction onSubmit={handleSubmit} />}
        </CreateTransactionScreen>
    );
}
