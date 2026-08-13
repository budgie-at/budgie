import { isDefined } from '@rnw-community/shared';

import { accountRepository, bankIntegrationRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

const NO_INTEGRATION_ID = 0;

export const useBankSyncToken = (accountId: number): string => {
    const { data: account } = useDatabaseLiveQuery(accountRepository.findById(accountId), [accountId]);
    const integrationId = account?.integrationId ?? NO_INTEGRATION_ID;
    const { data: integration } = useDatabaseLiveQuery(bankIntegrationRepository.findById(integrationId), [integrationId]);

    return isDefined(integration) ? integration.token : '';
};
