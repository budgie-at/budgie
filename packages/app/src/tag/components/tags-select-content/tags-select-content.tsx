import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList, View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { TagPickerBottomSheetSelectors } from '../../../@e2e/selectors/tag-picker-bottom-sheet.selector';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly data: FlatListDataItem<TagEntityInterface>[];
    readonly selectedTagIds: number[];
    readonly onSelect: (tagId: number) => void;
}

const NUM_COLUMNS = 3;

const keyExtractor = (item: FlatListDataItem<TagEntityInterface>, index: number) => (item.isEmpty ? `empty-${index}` : item.id.toString());

export const TagsSelectContent = (props: Props) => {
    const { data, selectedTagIds, onSelect } = props;
    const { t } = useLingui();
    const { flatListStyle, contentContainerStyle } = useFormsheetListStyles();

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
                testID={TagPickerBottomSheetSelectors.Card(item.title)}
            />
        );

    const listEmptyComponent = (
        <View className="flex-1 justify-center">
            <EmptyState
                icon={UserIconNameEnum.Tag}
                title={t`No tags found`}
                description={t`Try a different search term or create a new tag`}
            />
        </View>
    );

    return (
        <FlatList
            style={flatListStyle}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={NUM_COLUMNS}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            columnWrapperClassName="gap-x-lg mb-lg"
            contentContainerStyle={contentContainerStyle}
            ListEmptyComponent={listEmptyComponent}
        />
    );
};
