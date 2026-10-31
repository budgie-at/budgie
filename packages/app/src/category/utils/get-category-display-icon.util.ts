import { PLACEHOLDER_CATEGORY_ICON } from '../constant/placeholder-category-icon.constant';

import { needsIconChoice } from './needs-icon-choice.util';

import type { IconSearchEntryInterface } from '../../@generic/interface/icon-search-entry.interface';
import type { CategoryEntityInterface, UserIconType } from '@budgie/contracts';

export const getCategoryDisplayIcon = (
    category: Pick<CategoryEntityInterface, 'icon' | 'isDefault' | 'title' | 'titleEn' | 'titleTags'>,
    entries: readonly IconSearchEntryInterface[]
): UserIconType => (needsIconChoice(category, entries) ? PLACEHOLDER_CATEGORY_ICON : category.icon);
