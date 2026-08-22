import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

import { useGetTransactionSectionsQuery } from './use-get-transaction-sections.query';

import type { TransactionFilterInterface } from '@budgie/contracts';

export const useGetUncategorizedTransactionsQuery = (filters: TransactionFilterInterface) => {
    const language = useSetting('language');
    const { defaultInstrument } = useSettingsContext();
    const filterKey = `${buildTransactionFilterKey(filters)}|${language}|${defaultInstrument.id}`;
    const buildQuery = (limit: number) => transactionRepository.getUncategorized(limit, filters, language, defaultInstrument.id);

    return useGetTransactionSectionsQuery(buildQuery, filterKey);
};
