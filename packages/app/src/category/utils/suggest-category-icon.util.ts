import { isDefined } from '@rnw-community/shared';

import { iconSearchService } from '../../@generic/service/icon-search.service';
import { PLACEHOLDER_CATEGORY_ICON } from '../constant/placeholder-category-icon.constant';

import { getCategoryIconTerms } from './get-category-icon-terms.util';

import type { IconSearchEntryInterface } from '../../@generic/interface/icon-search-entry.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';

export const suggestCategoryIcon = (
    entries: readonly IconSearchEntryInterface[],
    category: Pick<CategoryEntityInterface, 'icon' | 'title' | 'titleEn' | 'titleTags'> | undefined,
    title: string
) => {
    const isUnchanged = isDefined(category) && title === category.title;
    const terms = getCategoryIconTerms(isUnchanged ? category : { title, titleEn: null, titleTags: null });
    const unmatchedIcon = isUnchanged ? category.icon : PLACEHOLDER_CATEGORY_ICON;

    return { terms, icon: iconSearchService.findConfidentIcon(entries, terms) ?? unmatchedIcon };
};
