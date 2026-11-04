import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

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
    readonly listHeaderComponent?: ReactElement;
    readonly onSelect: (tagId: number) => void;
    readonly onPrimarySelect?: (tagId: number) => void;
}

const FLOATING_DONE_BUTTON_BOTTOM_SPACE = 132;

const keyExtractor = (tag: TagEntityInterface) => String(tag.id);

export const TagsSelectContent = (props: Props) => {
    const {
        data,
        selectedTagIds,
        primaryTagId = null,
        isLoading = false,
        listEmptyComponent,
        listHeaderComponent,
        onSelect,
        onPrimarySelect
    } = props;
    const { t } = useLingui();
    const listContentStyle = useFormsheetListContentStyle(FLOATING_DONE_BUTTON_BOTTOM_SPACE);

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

    const listOptions = {
        estimatedItemSize: 60,
        contentContainerStyle: listContentStyle,
        ListEmptyComponent: emptyState,
        ListHeaderComponent: listHeaderComponent
    };

    return <SelectorList isLoading={isLoading} data={data} keyExtractor={keyExtractor} renderItem={renderItem} options={listOptions} />;
};
