import { AccountEntityTable, TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { DepositInterestService } from '@budgie/ledger';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const depositClosePrefillAtom = databaseQueryFamily(
    [TransactionEntityTable, TransactionEntryEntityTable, AccountEntityTable],
    DepositInterestService,
    (service, depositAccountId: number) => service.getClosePrefill(depositAccountId)
);

export const useDepositClosePrefillQuery = (depositAccountId: number) => {
    const result = useLiveAtomValue(depositClosePrefillAtom(depositAccountId));

    return { prefill: AsyncResult.getOrElse(result, () => null), isLoading: AsyncResult.isInitial(result) };
};
