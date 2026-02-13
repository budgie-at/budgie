import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

interface SuggestRuleActionItem {
    readonly label: MessageDescriptor;
    readonly value: string;
}

interface GetSuggestRuleActionItemsParams {
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

export const getSuggestRuleActionItems = ({ category, tags }: GetSuggestRuleActionItemsParams): SuggestRuleActionItem[] => {
    const items: SuggestRuleActionItem[] = [];

    if (isDefined(category)) {
        items.push({ label: msg`assign category`, value: category.title });
    }

    if (isNotEmptyArray(tags)) {
        tags.forEach(tag => {
            items.push({ label: msg`add tag`, value: tag.title });
        });
    }

    return items;
};
