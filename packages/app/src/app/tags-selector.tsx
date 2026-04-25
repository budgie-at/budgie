/* jscpd:ignore-start - Selector modal imports pattern */
import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
/* jscpd:ignore-end */
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { padFlatListData } from '../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../@generic/utils/sort-selected-first.util';
import { TagsSelectContent } from '../tag/components/tags-select-content/tags-select-content';
import { TagsSelectorDoneButton } from '../tag/components/tags-selector-done-button/tags-selector-done-button';
import { useTagFormModal } from '../tag/context/tag-form-modal.context';
import { useTagsSelectorModal } from '../tag/context/tags-selector-modal.context';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';
import { reorderTagIdsByPrimary } from '../tag/utils/reorder-tag-ids-by-primary.util';

import { TagsSelectorModalSelector } from './tags-selector-modal.selector';

const NUM_COLUMNS = 3;

const prepareTagData = (tags: TagEntityInterface[] | null, excludeTagIds: number[], selectedTagIds: number[]) => {
    const filtered = isNotEmptyArray(tags) ? tags.filter(tag => !excludeTagIds.includes(tag.id)) : [];

    return padFlatListData(sortSelectedFirst(filtered, selectedTagIds), NUM_COLUMNS);
};

const isSelectionDirty = (selected: number[], initial: number[]): boolean => {
    if (selected.length !== initial.length) {
        return true;
    }

    return selected.some((id, index) => id !== initial[index]);
};

const resolvePrimaryTagId = (selectedTagIds: number[], primaryTagId: number | null): number | null => {
    if (isEmptyArray(selectedTagIds)) {
        return null;
    }

    return isDefined(primaryTagId) && selectedTagIds.includes(primaryTagId) ? primaryTagId : selectedTagIds[0];
};

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export default function TagsSelectorModal() {
    const { t } = useLingui();
    const [openTagForm] = useTagFormModal();
    const [, resolveTagsSelector, currentParams] = useTagsSelectorModal();
    const { backgroundColor } = useFormsheetListStyles();

    const {
        initialTagIds = [],
        excludeTagIds = [],
        description,
        singleSelect = false,
        enablePrimarySelection = false
    } = currentParams ?? {};
    const initialPrimaryTagId = enablePrimarySelection ? (initialTagIds[0] ?? null) : null;

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<number[]>(initialTagIds);
    const [primaryTagId, setPrimaryTagId] = useState<number | null>(initialPrimaryTagId);
    const { tags } = useSearchTagsQuery(search);

    const selectedRef = useRef(selected);
    const primaryTagIdRef = useRef(primaryTagId);
    const hasResolvedRef = useRef(false);

    useEffect(() => {
        selectedRef.current = selected;
        primaryTagIdRef.current = primaryTagId;
    });

    const data = prepareTagData(tags, excludeTagIds, selected);
    const containerStyle = { flex: 1, backgroundColor };
    const dirty = isSelectionDirty(selected, initialTagIds) || primaryTagId !== initialPrimaryTagId;

    const handleSelectTag = (tagId: number) => {
        if (singleSelect) {
            hasResolvedRef.current = true;
            resolveTagsSelector([tagId]);

            return;
        }

        setSelected(previous => {
            const selectedTagIds = previous.includes(tagId) ? previous.filter(id => id !== tagId) : [...previous, tagId];
            const nextPrimaryTagId = resolvePrimaryTagId(selectedTagIds, primaryTagIdRef.current);

            setPrimaryTagId(nextPrimaryTagId);

            return reorderTagIdsByPrimary(selectedTagIds, nextPrimaryTagId);
        });
    };

    const handlePrimarySelect = (tagId: number) => {
        setPrimaryTagId(tagId);
        setSelected(previous => {
            const selectedTagIds = previous.includes(tagId) ? previous : [...previous, tagId];

            return reorderTagIdsByPrimary(selectedTagIds, tagId);
        });
    };

    const handleCreatePress = async () => {
        const result = await openTagForm({ defaultTitle: search });
        if (isDefined(result)) {
            setSelected(previous => {
                const selectedTagIds = [...previous, result.tag.id];
                const nextPrimaryTagId = resolvePrimaryTagId(selectedTagIds, primaryTagIdRef.current);

                setPrimaryTagId(nextPrimaryTagId);

                return reorderTagIdsByPrimary(selectedTagIds, nextPrimaryTagId);
            });
        }
    };

    const handleDone = () => {
        hasResolvedRef.current = true;
        resolveTagsSelector(reorderTagIdsByPrimary(selectedRef.current, primaryTagIdRef.current));
    };

    useEffect(
        () => () => {
            if (!hasResolvedRef.current) {
                resolveTagsSelector(reorderTagIdsByPrimary(selectedRef.current, primaryTagIdRef.current), { skipBack: true });
            }
        },
        [resolveTagsSelector]
    );

    /* jscpd:ignore-start - FormSheet selector modal pattern */
    return (
        <View style={containerStyle} collapsable={false}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                placeholder={t`Search tags...`}
                rightActionIcon={UserIconNameEnum.Plus}
                rightActionOnPress={handleCreatePress}
                rightActionTestID={TagsSelectorModalSelector.CreateButton}
                testID={TagsSelectorModalSelector.Input}
            />

            {isNotEmptyString(description) ? (
                <View className="px-xl pb-md">
                    <Text className="text-foreground text-sm">{description}</Text>
                </View>
            ) : null}

            <TagsSelectContent
                data={data}
                selectedTagIds={selected}
                primaryTagId={primaryTagId}
                enablePrimarySelection={enablePrimarySelection}
                onSelect={handleSelectTag}
                onPrimarySelect={handlePrimarySelect}
            />

            {dirty && !singleSelect ? (
                <TagsSelectorDoneButton count={selected.length} onPress={handleDone} testID={TagsSelectorModalSelector.DoneButton} />
            ) : null}
        </View>
    );
    /* jscpd:ignore-end */
}
