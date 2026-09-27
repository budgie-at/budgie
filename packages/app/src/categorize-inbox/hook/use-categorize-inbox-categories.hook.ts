import { useState } from 'react';

import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';

import type { CategoryEntityInterface } from '@budgie/contracts';

export const useCategorizeInboxCategories = (): ReadonlyMap<number, Pick<CategoryEntityInterface, 'id' | 'title' | 'icon'>> => {
    const { categories } = useNonSystemCategoriesQuery();

    const signature = categories.map(category => `${category.id}:${category.icon}:${category.title}`).join('|');
    const categoriesById = new Map(categories.map(category => [category.id, category]));
    const [snapshot, setSnapshot] = useState({ signature, categoriesById });

    if (snapshot.signature !== signature) {
        setSnapshot({ signature, categoriesById });
    }

    return snapshot.categoriesById;
};
