import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useGetTagByIdsQuery } from '../../tag/query/use-get-tag-by-ids.query';
import { useSearchTagsQuery } from '../../tag/query/use-search-tags.query';
import { BudgetEventFormValues } from '../constant/budget-event-form-schema.constant';

export const useBudgetEventTagPreview = () => {
    const { control } = useFormContext<BudgetEventFormValues>();
    const [tagId, name] = useWatch({ control, name: ['tagId', 'name'] });
    const selectedTagIds = isPositiveNumber(tagId) ? [tagId] : [];
    const { tags: pickedTags } = useGetTagByIdsQuery(selectedTagIds);
    const trimmedName = name.trim();
    const { tags: matchingTags } = useSearchTagsQuery(trimmedName);
    const matchedTag = (matchingTags ?? []).find(tag => tag.titleSearch === trimmedName.toLowerCase());

    if (isNotEmptyArray(pickedTags)) {
        return { selectedTagIds, trimmedName, title: pickedTags[0].title, isNew: false };
    }

    return {
        selectedTagIds,
        trimmedName,
        title: isDefined(matchedTag) ? matchedTag.title : trimmedName,
        isNew: !isDefined(matchedTag) && isNotEmptyString(trimmedName)
    };
};
