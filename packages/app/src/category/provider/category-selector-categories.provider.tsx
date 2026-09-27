import { type PropsWithChildren, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { categoryRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseTableLiveQuery } from '../../@generic/hook/use-database-table-live-query.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { CategorySelectorCategoriesContext } from '../context/category-selector-categories.context';

export const CategorySelectorCategoriesProvider = ({ children }: PropsWithChildren) => {
    const language = useSetting('language');
    const [selectorOpenedAt, setSelectorOpenedAt] = useState(0);

    const { data, updatedAt } = useDatabaseTableLiveQuery(categoryRepository.findBySearchQuery('', true, language), [
        language,
        selectorOpenedAt
    ]);

    const value = { categories: isDefined(updatedAt) ? data : null, markSelectorOpened: setSelectorOpenedAt };

    return <CategorySelectorCategoriesContext value={value}>{children}</CategorySelectorCategoriesContext>;
};
