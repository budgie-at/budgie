import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { SelectorGridSkeleton } from '../../../@generic/component/selector-grid-skeleton/selector-grid-skeleton';
import { useFormsheetListContentStyle } from '../../../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';
import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly data: FlatListDataItem<TagEntityInterface>[];
    readonly selectedTagIds: number[];
    readonly primaryTagId?: number | null;
    readonly isLoading?: boolean;
    readonly additionalBottomPadding?: number;
    readonly topOffset?: number;
    readonly onSelect: (tagId: number) => void;
    readonly onPrimarySelect?: (tagId: number) => void;
}

const TAG_CHIP_HEIGHT = 36;
const CHIP_GAP = 8;
const CHIP_FLOW_STYLE = { flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', gap: CHIP_GAP } as const;
const FLOATING_DONE_BUTTON_BOTTOM_SPACE = 120;

export const TagsSelectContent = (props: Props) => {
    const {
        data,
        selectedTagIds,
        primaryTagId = null,
        isLoading = false,
        additionalBottomPadding = FLOATING_DONE_BUTTON_BOTTOM_SPACE,
        topOffset,
        onSelect,
        onPrimarySelect
    } = props;
    const { t } = useLingui();
    const listContentStyle = useFormsheetListContentStyle(additionalBottomPadding, topOffset);

    const tags = data.flatMap(item => (item.isEmpty ? [] : [item]));
    const contentContainerStyle = { ...listContentStyle, ...CHIP_FLOW_STYLE };

    if (isLoading) {
        return (
            <SelectorGridSkeleton itemHeight={TAG_CHIP_HEIGHT} additionalBottomPadding={additionalBottomPadding} topOffset={topOffset} />
        );
    }

    if (!isNotEmptyArray(tags)) {
        return (
            <View className="absolute inset-0" style={listContentStyle}>
                <View className="pt-7xl">
                    <EmptyState
                        icon={UserIconNameEnum.Tag}
                        title={t`No tags found`}
                        description={t`Try a different search term or create a new tag`}
                    />
                </View>
            </View>
        );
    }

    return (
        <ScrollView className="absolute inset-0" contentContainerStyle={contentContainerStyle} keyboardShouldPersistTaps="handled">
            {tags.map(tag => (
                <TagsSelectorCard
                    key={tag.id}
                    isSelected={selectedTagIds.includes(tag.id)}
                    isPrimary={primaryTagId === tag.id}
                    onSelect={onSelect}
                    onPrimarySelect={onPrimarySelect}
                    variant="static"
                    title={tag.title}
                    id={tag.id}
                    testID={TagsSelectorModalSelector.Card(tag.title)}
                />
            ))}
        </ScrollView>
    );
};
