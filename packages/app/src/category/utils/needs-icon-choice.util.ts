import { CategoryIconSourceEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { iconSearchService } from '../../@generic/service/icon-search.service';
import { PLACEHOLDER_CATEGORY_ICONS } from '../constant/placeholder-category-icon.constant';

import { getCategoryIconTerms } from './get-category-icon-terms.util';

import type { IconSearchEntryInterface } from '../../@generic/interface/icon-search-entry.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';

export const needsIconChoice = (
    category: Pick<CategoryEntityInterface, 'icon' | 'iconSource' | 'isDefault' | 'title' | 'titleEn' | 'titleTags'>,
    entries: readonly IconSearchEntryInterface[]
): boolean =>
    isNotEmptyArray(entries) &&
    !category.isDefault &&
    category.iconSource === CategoryIconSourceEnum.AUTO &&
    PLACEHOLDER_CATEGORY_ICONS.some(icon => icon === category.icon) &&
    !isDefined(iconSearchService.findConfidentIcon(entries, getCategoryIconTerms(category)));
