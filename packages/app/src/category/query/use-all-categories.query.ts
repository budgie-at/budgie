import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { CategoryEntityInterface } from '@budgie/contracts';

const EMPTY_CATEGORIES: CategoryEntityInterface[] = [];

export const useAllCategoriesQuery = () => {
    const language = useSetting('language');
    const { data, error, updatedAt } = useLiveQuery(categoryRepository.findAll(language), [language]);

    if (!isDefined(data)) {
        return { isLoading: true, categories: EMPTY_CATEGORIES, updatedAt: null, error };
    }

    return { categories: data, isLoading: false, updatedAt, error };
};
