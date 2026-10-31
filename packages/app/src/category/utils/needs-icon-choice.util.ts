import { DEFAULT_CATEGORY_ICON } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { iconSearchService } from '../../@generic/service/icon-search.service';
import { resolveReiconIcon } from '../../@generic/utils/resolve-reicon-icon.util';

import { getCategoryIconTerms } from './get-category-icon-terms.util';

import type { IconSearchEntryInterface } from '../../@generic/interface/icon-search-entry.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';

export const needsIconChoice = (
    category: Pick<CategoryEntityInterface, 'icon' | 'isDefault' | 'title' | 'titleEn' | 'titleTags'>,
    entries: readonly IconSearchEntryInterface[]
): boolean =>
    isNotEmptyArray(entries) &&
    !category.isDefault &&
    category.icon === DEFAULT_CATEGORY_ICON &&
    iconSearchService.findConfidentIcon(entries, getCategoryIconTerms(category)) !== resolveReiconIcon(DEFAULT_CATEGORY_ICON);
