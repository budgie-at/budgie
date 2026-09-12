import { bankIntegrationRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useGetBankIntegrationCountQuery = (): number => {
    const { data } = useDatabaseLiveQuery(bankIntegrationRepository.count(), []);

    return data.at(0)?.count ?? 0;
};
