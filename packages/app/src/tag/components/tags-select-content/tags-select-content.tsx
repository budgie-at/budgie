import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emptyFn } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { useThemeContext } from '../../../theme/context/theme.context';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly data: FlatListDataItem<TagEntityInterface>[];
    readonly selectedTagIds: number[];
    readonly onToggle: (tagId: number) => void;
    readonly footerHeight: number;
}

const NUM_COLUMNS = 3;
const HEADER_OFFSET = 88;
const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

const keyExtractor = (item: FlatListDataItem<TagEntityInterface>, index: number) => (item.isEmpty ? `empty-${index}` : item.id.toString());

export const TagsSelectContent = (props: Props) => {
    const { data, selectedTagIds, onToggle, footerHeight } = props;
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { isDarkColorSchema } = useThemeContext();

    /* jscpd:ignore-start - FormSheet modal pattern from docs/plans/2025-01-24-formsheet-modal-learnings.md */
    const backgroundColor = isDarkColorSchema ? BG_DARK : BG_LIGHT;
    const flatListStyle = [StyleSheet.absoluteFill, { backgroundColor }];
    const contentContainerStyle = { paddingTop: HEADER_OFFSET, paddingBottom: bottom + footerHeight, flexGrow: 1 };
    /* jscpd:ignore-end */

    const renderItem = ({ item }: { item: FlatListDataItem<TagEntityInterface> }) =>
        item.isEmpty ? (
            <TagsSelectorCard className="opacity-0" isSelected={false} onSelect={emptyFn} variant="static" title="" id={0} />
        ) : (
            <TagsSelectorCard
                isSelected={selectedTagIds.includes(item.id)}
                onSelect={onToggle}
                variant="static"
                title={item.title}
                id={item.id}
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
            contentContainerClassName="px-3"
            contentContainerStyle={contentContainerStyle}
            ListEmptyComponent={listEmptyComponent}
        />
    );
};
