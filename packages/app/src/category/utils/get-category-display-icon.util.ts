import { CategoryIconSourceEnum, DEFAULT_CATEGORY_ICON } from '@budgie/contracts';

import { PLACEHOLDER_CATEGORY_ICON } from '../constant/placeholder-category-icon.constant';

import type { CategoryEntityInterface, UserIconType } from '@budgie/contracts';

export const getCategoryDisplayIcon = (category: Pick<CategoryEntityInterface, 'icon' | 'iconSource' | 'isDefault'>): UserIconType =>
    !category.isDefault && category.iconSource === CategoryIconSourceEnum.AUTO && category.icon === DEFAULT_CATEGORY_ICON
        ? PLACEHOLDER_CATEGORY_ICON
        : category.icon;
