import { isDefined } from '@rnw-community/shared';

import type { CategorizeInboxOneOffsLinkItemInterface } from '../interface/categorize-inbox-one-offs-link-item.interface';
import type { CategorizeInboxListItemType } from '@budgie/categorization';

export const getCategorizeInboxCardGroup = (
    item: CategorizeInboxListItemType | CategorizeInboxOneOffsLinkItemInterface | undefined
): string | null => {
    if (!isDefined(item) || !('rows' in item || 'oneOffs' in item)) {
        return null;
    }

    return 'rows' in item ? (item.titlePrefix ?? '') : '';
};
