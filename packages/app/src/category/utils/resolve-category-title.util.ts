import { isDefined } from '@rnw-community/shared';

import { DEFAULT_CATEGORY_TITLE } from '../../@generic/constant/default-category-title.constant';

import type { CategoryEntityInterface } from '@budgie/contracts';
import type { MessageDescriptor } from '@lingui/core';

type ResolvableCategory = Pick<CategoryEntityInterface, 'id' | 'title' | 'isDefault'>;

type TranslateFn = (descriptor: MessageDescriptor) => string;

export const resolveCategoryTitle = (category: ResolvableCategory, t: TranslateFn): string => {
    if (!category.isDefault) {
        return category.title;
    }
    const descriptor = DEFAULT_CATEGORY_TITLE[category.id];

    return isDefined(descriptor) ? t(descriptor) : category.title;
};
