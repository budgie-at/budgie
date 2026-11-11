import { HouseholdShareService } from '@budgie/cloud-sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

export const useHouseholdAccountsSharing = () => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();

    const setShared = (accountIds: readonly number[], isShared: boolean) =>
        run(
            Effect.flatMap(HouseholdShareService, householdShareService =>
                isShared ? householdShareService.shareAccounts(accountIds) : householdShareService.unshareAccounts(accountIds)
            ).pipe(toastOnFailure(t`Could not update sharing`))
        );

    return { setShared, isLoading };
};
