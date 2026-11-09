import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { formatCategorizeInboxMerchantTitle } from './format-categorize-inbox-merchant-title.util';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

const LEADING_SEPARATOR_PATTERN = /^[\s\-–—:,;.|/]+/u;

export const formatCategorizeInboxRowTitle = ({
    displayTitle,
    titlePrefix
}: Pick<CategorizeInboxClusterInterface, 'displayTitle' | 'titlePrefix'>): string => {
    const remainder = isDefined(titlePrefix)
        ? displayTitle.trim().split(/\s+/u).slice(titlePrefix.split(' ').length).join(' ').replace(LEADING_SEPARATOR_PATTERN, '')
        : '';

    return isNotEmptyString(remainder)
        ? formatCategorizeInboxMerchantTitle(remainder).replace(/^\p{Ll}/u, letter => letter.toLocaleUpperCase())
        : formatCategorizeInboxMerchantTitle(displayTitle);
};
