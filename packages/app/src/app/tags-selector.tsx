import { useLingui } from '@lingui/react/macro';
import { useEffect, useEffectEvent, useReducer, useRef, useState } from 'react';
import { Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalDescription } from '../@generic/component/selector-modal-description/selector-modal-description';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorNoResultsState } from '../@generic/component/selector-no-results-state/selector-no-results-state';
import { SheetHeaderAction } from '../@generic/component/sheet-header-action/sheet-header-action';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { TagCreateRow } from '../tag/components/tag-create-row/tag-create-row';
import { TagsSelectContent } from '../tag/components/tags-select-content/tags-select-content';
import { useTagFormModal } from '../tag/context/tag-form-modal.context';
import { useTagsSelectorModal, useTagsSelectorModalParams } from '../tag/context/tags-selector-modal.context';
import { TagsSelectorActionTypeEnum } from '../tag/enum/tags-selector-action-type.enum';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';
import { reorderTagIdsByPrimary } from '../tag/utils/reorder-tag-ids-by-primary.util';
import { tagsSelectorReducer } from '../tag/utils/tags-selector-reducer.util';

import { TagsSelectorModalSelector } from './tags-selector-modal.selector';

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

    const data = (tags ?? []).filter(tag => !excludeTagIds.includes(tag.id));
    const query = search.trim();
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
        openTagForm({ defaultTitle: query }, result => {
            if (isDefined(result) && singleSelect) {
                resolveSelection([result.tag.id]);
            } else if (isDefined(result)) {
                dispatch({ type: TagsSelectorActionTypeEnum.TAG_ADDED, tagId: result.tag.id });
            }
        });
    };

    const handleDone = () => void resolveSelection(reorderTagIdsByPrimary(selected, primaryTagId));

    const handleUnmount = useEffectEvent(() => {
        if (!hasResolvedRef.current) {
            resolveTagsSelector(null, { skipBack: true });
        }
    });

    useEffect(() => () => void handleUnmount(), []);

    const listEmptyComponent = isNotEmptyString(query) ? (
        <SelectorNoResultsState query={query} hint={t`Check the spelling or create it as a new tag.`} onCreate={handleCreatePress} />
    ) : (
        void 0
    );

    const count = selected.length;
    const doneAction = singleSelect ? null : (
        <SheetHeaderAction label={t`Done`} onPress={handleDone} testID={TagsSelectorModalSelector.DoneButton} />
    );

    return (
        <SheetSurface
            footer={
                <Text
                    className="text-center text-[13px] text-secondary-foreground"
                    maxFontSizeMultiplier={1.6}
                >{t`${count} selected`}</Text>
            }
        >
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                title={t`Tags`}
                placeholder={t`Search tags…`}
                trailing={doneAction}
                testID={TagsSelectorModalSelector.Input}
            />

            <SelectorModalDescription title={title} description={description}>
                <TagsSelectContent
                    header={<TagCreateRow onPress={handleCreatePress} />}
                    listEmptyComponent={listEmptyComponent}
                    data={data}
                    selectedTagIds={selected}
                    primaryTagId={primaryTagId}
                    isLoading={isLoading}
                    onSelect={handleSelectTag}
                    {...(enablePrimarySelection && { onPrimarySelect: handlePrimarySelect })}
                />
            </SelectorModalDescription>
        </SheetSurface>
    );
}
