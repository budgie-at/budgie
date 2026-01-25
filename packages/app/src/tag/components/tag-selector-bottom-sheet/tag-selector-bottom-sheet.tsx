/* jscpd:ignore-start */
import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { emptyFn, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { TagPickerBottomSheetSelectors } from '../../../@e2e/selectors/tag-picker-bottom-sheet.selector';
import { SearchableListBottomSheet } from '../../../@generic/component/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { FlatListDataItem, padFlatListData } from '../../../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../../../@generic/utils/sort-selected-first.util';
import { useSearchTagsQuery } from '../../query/use-search-tags.query';
import { TagFormBottomSheet } from '../tag-form-bottom-sheet/tag-form-bottom-sheet';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly description?: string;
    readonly excludeTagIds?: number[];
    readonly onSelect: (tagId: number | null) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedTag: TagEntityInterface | null;
}

const keyExtractor = (item: FlatListDataItem<TagEntityInterface>, index: number) => (item.isEmpty ? `empty-${index}` : item.id.toString());

const flatListProps = {
    numColumns: 3,
    columnWrapperClassName: 'gap-x-lg',
    contentContainerClassName: 'gap-y-lg px-3 pt-xl'
};

export const TagSelectorBottomSheet = ({ ref, description, excludeTagIds, selectedTag, onSelect }: Props) => {
    const { t } = useLingui();

    const [search, setSearch] = useState('');
    const [newTagTitle, setNewTagTitle] = useState('');
    const tagFormRef = useRef<BottomSheetInterface | null>(null);

    const { tags } = useSearchTagsQuery(search);

    const handleSelect = (tagId: number) => {
        if (tagId === selectedTag?.id) {
            onSelect(null);

            return;
        }

        onSelect(tagId);
        void ref.current?.dismiss();
    };

    const handleCreateTag = () => {
        setNewTagTitle(search);
        void tagFormRef.current?.open();
    };

    const handleTagCreated = (tag: TagEntityInterface) => {
        setSearch('');
        setNewTagTitle('');
        handleSelect(tag.id);
    };

    const filteredTags = isNotEmptyArray(tags)
        ? tags.filter(tag => (isDefined(excludeTagIds) ? !excludeTagIds.includes(tag.id) : true))
        : [];
    const data = padFlatListData(sortSelectedFirst(filteredTags, isDefined(selectedTag) ? [selectedTag.id] : []), 3);

    const headerContent = isNotEmptyString(description) ? (
        <View className="px-3 pb-md">
            <Text className="text-foreground text-sm">{description}</Text>
        </View>
    ) : null;

    const renderItem = ({ item }: { item: FlatListDataItem<TagEntityInterface> }) =>
        item.isEmpty ? (
            <TagsSelectorCard className="opacity-0" isSelected={false} onSelect={emptyFn} variant="static" title="" id={0} />
        ) : (
            <TagsSelectorCard
                isSelected={item.id === selectedTag?.id}
                onSelect={handleSelect}
                variant="static"
                title={item.title}
                id={item.id}
            />
        );

    return (
        <>
            <SearchableListBottomSheet
                ref={ref}
                onSearchChange={setSearch}
                searchPlaceholder={t`Search tags...`}
                search={search}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                emptyDescription={t`Try a different search term`}
                emptyTitle={t`No tags found`}
                data={data}
                inputTestID={TagPickerBottomSheetSelectors.Input}
                flatListProps={flatListProps}
                headerContent={headerContent}
                rightActionIcon={UserIconNameEnum.Plus}
                rightActionOnPress={handleCreateTag}
            />
            <TagFormBottomSheet ref={tagFormRef} tag={null} defaultTitle={newTagTitle} onTagSaved={handleTagCreated} />
        </>
    );
};
/* jscpd:ignore-end */
