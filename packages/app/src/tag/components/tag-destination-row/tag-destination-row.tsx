import { DestinationRow } from '../../../@generic/component/destination-row/destination-row';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { TagsSelectorModalSelector } from '../../../app/tags-selector-modal.selector';
import { TagMonogram } from '../tag-monogram/tag-monogram';

import type { EntityUsageInterface } from '../../../@generic/interface/entity-usage.interface';
import type { TagEntityInterface } from '@budgie/contracts';

interface Props {
    readonly tag: TagEntityInterface;
    readonly usage: EntityUsageInterface | undefined;
    readonly isSelected: boolean;
    readonly isDisabled: boolean;
    readonly onSelect: (id: number) => void;
}

export const TagDestinationRow = ({ tag, usage, isSelected, isDisabled, onSelect }: Props) => {
    const formatUsage = useFormatEntityUsage();

    return (
        <DestinationRow
            id={tag.id}
            title={tag.title}
            subtitle={formatUsage(usage)}
            left={<TagMonogram title={tag.title} />}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onSelect={onSelect}
            testID={TagsSelectorModalSelector.Card(tag.title)}
        />
    );
};
