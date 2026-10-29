import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { TagsSelectorActionTypeEnum } from '../enum/tags-selector-action-type.enum';
import { TagsSelectorActionInterface } from '../interface/tags-selector-action.interface';
import { TagsSelectorStateInterface } from '../interface/tags-selector-state.interface';

import { reorderTagIdsByPrimary } from './reorder-tag-ids-by-primary.util';

const resolvePrimaryTagId = (selectedTagIds: readonly number[], primaryTagId: number | null): number | null => {
    if (isEmptyArray(selectedTagIds)) {
        return null;
    }

    return isDefined(primaryTagId) && selectedTagIds.includes(primaryTagId) ? primaryTagId : selectedTagIds[0];
};

export const tagsSelectorReducer = (state: TagsSelectorStateInterface, action: TagsSelectorActionInterface): TagsSelectorStateInterface => {
    if (action.type === TagsSelectorActionTypeEnum.PRIMARY_SELECTED) {
        const selectedTagIds = state.selected.includes(action.tagId) ? state.selected : [...state.selected, action.tagId];

        return { selected: reorderTagIdsByPrimary(selectedTagIds, action.tagId), primaryTagId: action.tagId };
    }

    const isRemoval = action.type === TagsSelectorActionTypeEnum.TAG_TOGGLED && state.selected.includes(action.tagId);
    const selectedTagIds = isRemoval ? state.selected.filter(tagId => tagId !== action.tagId) : [...state.selected, action.tagId];
    const primaryTagId = resolvePrimaryTagId(selectedTagIds, state.primaryTagId);

    return { selected: reorderTagIdsByPrimary(selectedTagIds, primaryTagId), primaryTagId };
};
