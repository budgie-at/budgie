import { useLingui } from '@lingui/react/macro';
import { useEffect, useReducer, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { SelectorModalDescription } from '../@generic/component/selector-modal-description/selector-modal-description';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { prepareSelectorGridData } from '../@generic/utils/prepare-selector-grid-data.util';
import { TagsSelectContent } from '../tag/components/tags-select-content/tags-select-content';
import { TagsSelectorDoneButton } from '../tag/components/tags-selector-done-button/tags-selector-done-button';
import { useTagFormModal } from '../tag/context/tag-form-modal.context';
import { useTagsSelectorModal, useTagsSelectorModalParams } from '../tag/context/tags-selector-modal.context';
import { TagsSelectorActionTypeEnum } from '../tag/enum/tags-selector-action-type.enum';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';
import { reorderTagIdsByPrimary } from '../tag/utils/reorder-tag-ids-by-primary.util';
import { tagsSelectorReducer } from '../tag/utils/tags-selector-reducer.util';

import { TagsSelectorModalSelector } from './tags-selector-modal.selector';

const isSelectionDirty = (selected: number[], initial: number[]): boolean => {
    if (selected.length !== initial.length) {
        return true;
    }

    return selected.some((id, index) => id !== initial[index]);
};

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export default function TagsSelectorModal() {
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();
    const [, resolveTagsSelector, dismissTagsSelector] = useTagsSelectorModal();
    useModalDismiss(dismissTagsSelector);
    const currentParams = useTagsSelectorModalParams();

    const {
        initialTagIds = [],
        suggestedTagIds = [],
        excludeTagIds = [],
        title,
        description,
        singleSelect = false,
        enablePrimarySelection = false
    } = currentParams ?? {};
    const initialPrimaryTagId = enablePrimarySelection ? (initialTagIds[0] ?? null) : null;
    const initialSelectedTagIds = [...initialTagIds, ...suggestedTagIds.filter(tagId => !initialTagIds.includes(tagId))];

    const [search, setSearch] = useState('');
    const [{ selected, primaryTagId }, dispatch] = useReducer(tagsSelectorReducer, {
        selected: initialSelectedTagIds,
        primaryTagId: initialPrimaryTagId
    });
    const { tags, isLoading } = useSearchTagsQuery(search);

    const hasResolvedRef = useRef(false);

    const data = prepareSelectorGridData(tags, excludeTagIds, selected);
    const dirty = isSelectionDirty(selected, initialTagIds) || primaryTagId !== initialPrimaryTagId;

    const resolveSelection = (tagIds: number[]) => {
        hasResolvedRef.current = true;
        resolveTagsSelector(tagIds);
    };

    const handleSelectTag = (tagId: number) => {
        if (singleSelect) {
            resolveSelection([tagId]);
        } else {
            dispatch({ type: TagsSelectorActionTypeEnum.TAG_TOGGLED, tagId });
        }
    };

    const handlePrimarySelect = (tagId: number) => void dispatch({ type: TagsSelectorActionTypeEnum.PRIMARY_SELECTED, tagId });

    const handleCreatePress = () => {
        openTagForm({ defaultTitle: search }, result => {
            if (isDefined(result) && singleSelect) {
                resolveSelection([result.tag.id]);
            } else if (isDefined(result)) {
                dispatch({ type: TagsSelectorActionTypeEnum.TAG_ADDED, tagId: result.tag.id });
            }
        });
    };

    const handleDone = () => void resolveSelection(reorderTagIdsByPrimary(selected, primaryTagId));

    useEffect(
        () => () => {
            if (!hasResolvedRef.current) {
                resolveTagsSelector(null, { skipBack: true });
            }
        },
        [resolveTagsSelector]
    );

    return (
        <SheetSurface>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search tags…`}
                createLabel={t`Create tag`}
                onCreate={handleCreatePress}
                createTestID={TagsSelectorModalSelector.CreateButton}
                testID={TagsSelectorModalSelector.Input}
            />

            <SelectorModalDescription title={title} description={description}>
                {topOffset => (
                    <TagsSelectContent
                        topOffset={topOffset}
                        data={data}
                        selectedTagIds={selected}
                        primaryTagId={primaryTagId}
                        isLoading={isLoading}
                        onSelect={handleSelectTag}
                        {...(enablePrimarySelection && { onPrimarySelect: handlePrimarySelect })}
                    />
                )}
            </SelectorModalDescription>

            {dirty && !singleSelect ? (
                <TagsSelectorDoneButton count={selected.length} onPress={handleDone} testID={TagsSelectorModalSelector.DoneButton} />
            ) : null}
        </SheetSurface>
    );
}
