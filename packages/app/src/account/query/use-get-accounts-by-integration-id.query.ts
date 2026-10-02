import { AccountEntityTable, AccountRepository, InstrumentEntityTable } from '@budgie/contracts';
import * as Cause from 'effect/Cause';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const accountsByIntegrationIdAtom = databaseQueryFamily(
    [AccountEntityTable, InstrumentEntityTable],
    AccountRepository,
    (accountRepository, integrationId: number) => accountRepository.findByIntegrationId(integrationId)
);

export const useGetAccountsByIntegrationIdQuery = (integrationId: number) => {
    const result = useLiveAtomValue(accountsByIntegrationIdAtom(integrationId));
    const error = AsyncResult.isFailure(result) ? Cause.squash(result.cause) : null;
    const accounts = AsyncResult.getOrElse(result, () => null);

    if (!isDefined(accounts)) {
        return { isLoading: true, accounts: null, error };
    }

    return { accounts, isLoading: false, error };
};
