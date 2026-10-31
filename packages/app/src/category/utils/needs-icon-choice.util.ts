import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { iconSearchService } from '../../@generic/service/icon-search.service';

import { getCategoryIconTerms } from './get-category-icon-terms.util';
import { hasPlaceholderIcon } from './has-placeholder-icon.util';

import type { IconSearchEntryInterface } from '../../@generic/interface/icon-search-entry.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';

export const needsIconChoice = (
    category: Pick<CategoryEntityInterface, 'icon' | 'title' | 'titleEn' | 'titleTags' | 'createdAt' | 'updatedAt'>,
    entries: readonly IconSearchEntryInterface[]
): boolean =>
    isNotEmptyArray(entries) &&
    hasPlaceholderIcon(category, entries) &&
    !isDefined(iconSearchService.findConfidentIcon(entries, getCategoryIconTerms(category)));
