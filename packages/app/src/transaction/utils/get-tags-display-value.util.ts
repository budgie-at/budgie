import { TagEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

export const getTagsDisplayValue = (tags: Pick<TagEntityInterface, 'title'>[] | null): string | undefined => {
    if (!isNotEmptyArray(tags)) {
        return void 0;
    }

    if (tags.length === 1) {
        return tags[0].title;
    }

    return `${tags[0].title} +${tags.length - 1}`;
};
