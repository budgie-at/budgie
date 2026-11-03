import { isNotEmptyString } from '@rnw-community/shared';

import type { MccCategoryEntityInterface } from '@budgie/contracts';

export const filterCategories = (categories: MccCategoryEntityInterface[], search: string) =>
    categories.filter(category => {
        if (!isNotEmptyString(search)) {
            return true;
        }

        const searchLower = search.toLowerCase();

        return (
            category.mcc.toLowerCase().includes(searchLower) ||
            category.shortDescription.toLowerCase().includes(searchLower) ||
            category.fullDescription.toLowerCase().includes(searchLower)
        );
    });
