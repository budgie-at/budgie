import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { BudgieLegendList } from '../../../@generic/component/budgie-legend-list/budgie-legend-list';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { ListItemSeparator } from '../../../@generic/component/list-item-separator/list-item-separator';
import { SelectorGridSkeleton } from '../../../@generic/component/selector-grid-skeleton/selector-grid-skeleton';
import { LEGEND_LIST_STYLE } from '../../../@generic/constant/legend-list.constant';
import { useFormsheetListContentStyle } from '../../../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

import type { ReactElement } from 'react';

interface Props {
    readonly data: TagEntityInterface[];
    readonly selectedTagIds: number[];
    readonly primaryTagId?: number | null;
    readonly isLoading?: boolean;
    readonly listEmptyComponent?: ReactElement;
    readonly topOffset?: number;
    readonly onSelect: (tagId: number) => void;
    readonly onPrimarySelect?: (tagId: number) => void;
}

const TAG_CHIP_HEIGHT = 36;
const FLOATING_DONE_BUTTON_BOTTOM_SPACE = 132;

const keyExtractor = (tag: TagEntityInterface) => String(tag.id);

export const TagsSelectContent = (props: Props) => {
    const {
        data,
        selectedTagIds,
        primaryTagId = null,
        isLoading = false,
        listEmptyComponent,
        topOffset,
        onSelect,
        onPrimarySelect
    } = props;
    const { t } = useLingui();
    const listContentStyle = useFormsheetListContentStyle(FLOATING_DONE_BUTTON_BOTTOM_SPACE, topOffset);

    if (isLoading) {
        return (
            <SelectorGridSkeleton
                itemHeight={TAG_CHIP_HEIGHT}
                additionalBottomPadding={FLOATING_DONE_BUTTON_BOTTOM_SPACE}
                topOffset={topOffset}
            />
        );
    }

    const emptyState = listEmptyComponent ?? (
        <EmptyState icon={UserIconNameEnum.Tag} title={t`No tags found`} description={t`Try a different search term or create a new tag`} />
    );
    const renderItem = ({ item: tag }: { item: TagEntityInterface }) => (
        <TagsSelectorCard
            isSelected={selectedTagIds.includes(tag.id)}
            isPrimary={primaryTagId === tag.id}
            onSelect={onSelect}
            onPrimarySelect={onPrimarySelect}
            variant="static"
            title={tag.title}
            id={tag.id}
            testID={TagsSelectorModalSelector.Card(tag.title)}
        />
    );

    return (
        <View className="absolute inset-0">
            <BudgieLegendList
                style={LEGEND_LIST_STYLE}
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                estimatedItemSize={44}
                ItemSeparatorComponent={ListItemSeparator}
                contentContainerStyle={listContentStyle}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={emptyState}
            />
        </View>
    );
};
