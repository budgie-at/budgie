import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList, View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly data: FlatListDataItem<TagEntityInterface>[];
    readonly selectedTagIds: number[];
    readonly primaryTagId?: number | null;
    readonly enablePrimarySelection?: boolean;
    readonly onSelect: (tagId: number) => void;
    readonly onPrimarySelect?: (tagId: number) => void;
}

const NUM_COLUMNS = 3;
const FLOATING_DONE_BUTTON_BOTTOM_SPACE = 96;

const keyExtractor = (item: FlatListDataItem<TagEntityInterface>, index: number) => (item.isEmpty ? `empty-${index}` : item.id.toString());

export const TagsSelectContent = (props: Props) => {
    const { data, selectedTagIds, primaryTagId = null, enablePrimarySelection = false, onSelect, onPrimarySelect } = props;
    const { t } = useLingui();
    const { flatListStyle, contentContainerStyle } = useFormsheetListStyles(FLOATING_DONE_BUTTON_BOTTOM_SPACE);

    const renderItem = ({ item }: { item: FlatListDataItem<TagEntityInterface> }) => {
        const handlePrimarySelect = enablePrimarySelection ? onPrimarySelect : void 0;

        return item.isEmpty ? (
            <TagsSelectorCard className="opacity-0" isSelected={false} onSelect={emptyFn} variant="static" title="" id={0} />
        ) : (
            <TagsSelectorCard
                isSelected={selectedTagIds.includes(item.id)}
                isPrimary={primaryTagId === item.id}
                onSelect={onSelect}
                onPrimarySelect={handlePrimarySelect}
                variant="static"
                title={item.title}
                id={item.id}
                testID={TagsSelectorModalSelector.Card(item.title)}
            />
        );
    };

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
