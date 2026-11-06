import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { SelectorList } from '../../../@generic/component/selector-list/selector-list';
import { useFormsheetListContentStyle } from '../../../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { TagSelectorRow } from '../tag-selector-row/tag-selector-row';

import type { ReactElement } from 'react';

interface Props {
    readonly data: TagEntityInterface[];
    readonly selectedTagIds: number[];
    readonly primaryTagId?: number | null;
    readonly isLoading?: boolean;
    readonly listEmptyComponent?: ReactElement;
    readonly onSelect: (tagId: number) => void;
    readonly onPrimarySelect?: (tagId: number) => void;
    readonly header?: ReactElement;
}

const keyExtractor = (tag: TagEntityInterface) => String(tag.id);

export const TagsSelectContent = (props: Props) => {
    const { data, selectedTagIds, primaryTagId = null, isLoading = false, listEmptyComponent, onSelect, onPrimarySelect } = props;
    const { t } = useLingui();
    const listContentStyle = useFormsheetListContentStyle();

    const emptyState = listEmptyComponent ?? (
        <EmptyState icon={UserIconNameEnum.Tag} title={t`No tags found`} description={t`Create a new tag to get started.`} />
    );
    const renderItem = ({ item: tag, index }: { item: TagEntityInterface; index: number }) => (
        <GroupedListItem isFirst={index === 0} isLast={index === data.length - 1}>
            <TagSelectorRow
                tag={tag}
                isSelected={selectedTagIds.includes(tag.id)}
                isPrimary={primaryTagId === tag.id}
                onSelect={onSelect}
                onPrimarySelect={onPrimarySelect}
            />
        </GroupedListItem>
    );

    const hint = onPrimarySelect ? (
        <Text className="px-xl py-lg text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.6}>
            <Trans>The primary tag is used in summaries. Choose Make primary on another selected tag to change it.</Trans>
        </Text>
    ) : null;
    const listOptions = {
        estimatedItemSize: 60,
        contentContainerStyle: listContentStyle,
        ListEmptyComponent: emptyState,
        ListHeaderComponent: props.header,
        ListFooterComponent: hint
    };
    const initialScrollIndex = data.findIndex(tag => selectedTagIds.includes(tag.id));

    return (
        <SelectorList
            isLoading={isLoading}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            options={listOptions}
            initialScrollIndex={initialScrollIndex}
        />
    );
};
