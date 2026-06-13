import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

export const useGetTransactionByIdQuery = (id: number | null) => {
    const language = useSetting('language');
    const shouldQuery = isPositiveNumber(id);
    const transactionId = shouldQuery ? id : 0;
    const { data, error, updatedAt } = useLiveQuery(transactionRepository.getById(transactionId, language), [transactionId, language]);

    if (!shouldQuery) {
        return { transaction: null, isLoading: false, error: null };
    }

    return isDefined(updatedAt)
        ? { transaction: data, isLoading: false, error: error ?? null }
        : { transaction: null, isLoading: true, error: null };
};
