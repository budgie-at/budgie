import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

export const useGetTransactionByIdQuery = (id: number) => {
    const language = useSetting('language');
    const { data, error, updatedAt } = useLiveQuery(transactionRepository.getById(id, language), [id, language]);

    return isDefined(updatedAt)
        ? { transaction: data, isLoading: false, error: error ?? null }
        : { transaction: null, isLoading: true, error: null };
};
