import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { SelectorGridContent } from '../../../@generic/component/selector-grid-content/selector-grid-content';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly data: FlatListDataItem<TagEntityInterface>[];
    readonly selectedTagIds: number[];
    readonly primaryTagId?: number | null;
    readonly enablePrimarySelection?: boolean;
    readonly isLoading?: boolean;
    readonly alignToBottom?: boolean;
    readonly additionalBottomPadding?: number;
    readonly topOffset?: number;
    readonly onSelect: (tagId: number) => void;
    readonly onPrimarySelect?: (tagId: number) => void;
}

const TAG_CARD_HEIGHT = 56;
const FLOATING_DONE_BUTTON_BOTTOM_SPACE = 96;

const keyExtractor = (item: FlatListDataItem<TagEntityInterface>, index: number) => (item.isEmpty ? `empty-${index}` : item.id.toString());

export const TagsSelectContent = (props: Props) => {
    const {
        data,
        selectedTagIds,
        primaryTagId = null,
        enablePrimarySelection = false,
        isLoading = false,
        alignToBottom = false,
        additionalBottomPadding = FLOATING_DONE_BUTTON_BOTTOM_SPACE,
        topOffset,
        onSelect,
        onPrimarySelect
    } = props;
    const { t } = useLingui();

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
        <SelectorGridContent
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            itemHeight={TAG_CARD_HEIGHT}
            listEmptyComponent={listEmptyComponent}
            isLoading={isLoading}
            alignToBottom={alignToBottom}
            additionalBottomPadding={additionalBottomPadding}
            topOffset={topOffset}
        />
    );
};
