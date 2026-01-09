import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { useLingui } from '@lingui/react/macro';
import { FC, RefObject, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { SearchableListBottomSheet } from '../../../@generic/component/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { FlatListDataItem, padFlatListData } from '../../../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../../../@generic/utils/sort-selected-first.util';
import { useSearchTagsQuery } from '../../query/use-search-tags.query';
import { TagFormBottomSheet } from '../tag-form-bottom-sheet/tag-form-bottom-sheet';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';
import { TagsSelectorFooter } from '../tags-selector-footer/tags-selector-footer';

interface Props {
    readonly selectedTagIds: number[];
    readonly onSelect: (tagId: number) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const keyExtractor = (item: FlatListDataItem<TagEntityInterface>, index: number) => (item.isEmpty ? `empty-${index}` : item.id.toString());

const flatListProps = {
    numColumns: 3,
    columnWrapperClassName: 'gap-x-lg',
    contentContainerClassName: 'gap-y-lg px-3 pt-xl'
};

export const TagsSelectorBottomSheet = ({ ref, selectedTagIds, onSelect }: Props) => {
    const [search, setSearch] = useState('');
    const { tags } = useSearchTagsQuery(search);
    const { t } = useLingui();
    const tagFormRef = useRef<BottomSheetInterface | null>(null);

    const sortedTags = sortSelectedFirst(tags ?? [], selectedTagIds);
    const data = padFlatListData(sortedTags, 3);
    const handleCreateTag = () => void tagFormRef.current?.open();
    const handleClose = () => void ref.current?.close();
    const handleTagCreated = (tag: TagEntityInterface) => {
        setSearch('');
        onSelect(tag.id);
    };

    const renderItem = ({ item }: { item: FlatListDataItem<TagEntityInterface> }) =>
        item.isEmpty ? (
            <TagsSelectorCard className="opacity-0" isSelected={false} onSelect={emptyFn} variant="static" title="" id={0} />
        ) : (
            <TagsSelectorCard
                isSelected={selectedTagIds.includes(item.id)}
                onSelect={onSelect}
                variant="static"
                title={item.title}
                id={item.id}
            />
        );

    const footerComponent: FC<BottomSheetFooterProps> = () => (
        <TagsSelectorFooter selectedTagsCount={selectedTagIds.length} onClose={handleClose} />
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
                emptyDescription={t`Try a different search term or create a new tag`}
                emptyIcon={UserIconNameEnum.Tag}
                emptyTitle={t`No tags found`}
                data={data}
                flatListProps={flatListProps}
                rightActionIcon={UserIconNameEnum.Plus}
                rightActionOnPress={handleCreateTag}
                footerComponent={footerComponent}
            />

            <TagFormBottomSheet ref={tagFormRef} tag={null} defaultTitle={search} onTagCreated={handleTagCreated} />
        </>
    );
};
