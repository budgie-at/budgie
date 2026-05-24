import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

export const useGetCategoryByIdQuery = (id: number) => {
    const language = useSetting('language');
    const { data, updatedAt, error } = useLiveQuery(categoryRepository.findById(id, language), [id, language]);

    if (!isDefined(data)) {
        return { isLoading: true, category: null, updatedAt: null, error };
    }

    const category = data.at(0) ?? null;

    return { category, isLoading: false, updatedAt, error };
};
