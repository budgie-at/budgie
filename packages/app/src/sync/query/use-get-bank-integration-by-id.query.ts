import { isDefined } from '@rnw-community/shared';

import { bankIntegrationRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useGetBankIntegrationByIdQuery = (id: number) => {
    const { data, updatedAt, error } = useDatabaseLiveQuery(bankIntegrationRepository.findById(id), [id]);

    if (!isDefined(data)) {
        return { isLoading: !isDefined(updatedAt), integration: null, updatedAt, error };
    }

    return { integration: data, isLoading: false, updatedAt, error };
};
