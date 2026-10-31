import { needsIconChoice } from './needs-icon-choice.util';

import type { IconSearchEntryInterface } from '../../@generic/interface/icon-search-entry.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';

export const canAutoApplyCategoryIcon = (
    category: Pick<CategoryEntityInterface, 'icon' | 'isDefault' | 'title' | 'titleEn' | 'titleTags' | 'createdAt' | 'updatedAt'>,
    entries: readonly IconSearchEntryInterface[]
): boolean => needsIconChoice(category, entries) && category.updatedAt.getTime() === category.createdAt.getTime();
