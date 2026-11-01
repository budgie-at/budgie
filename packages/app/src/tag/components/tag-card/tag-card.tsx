import { TagEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EntityListRow } from '../../../@generic/component/entity-list-row/entity-list-row';
import { useDeleteTag } from '../../hooks/use-delete-tag.hook';
import { useMergeTag } from '../../hooks/use-merge-tag.hook';
import { TagMonogram } from '../tag-monogram/tag-monogram';

import { TagCardSelector } from './tag-card.selector';

import type { EntityRowOperationsInterface } from '../../../@generic/interface/entity-row-operations.interface';
import type { EntityUsageInterface } from '../../../@generic/interface/entity-usage.interface';

interface Props {
    readonly tag: TagEntityInterface;
    readonly usage: EntityUsageInterface | undefined;
    readonly isFirst: boolean;
    readonly isLast: boolean;
    readonly onOpen: (tag: TagEntityInterface) => void;
}

export const TagCard = ({ onOpen, tag, usage, isFirst, isLast }: Props) => {
    const { t } = useLingui();
    const deleteTag = useDeleteTag();
    const mergeTag = useMergeTag();
    const handleOpen = () => void onOpen(tag);
    const operations: EntityRowOperationsInterface = {
        deleteLabel: t`Delete`,
        onMerge: trackMutation => mergeTag(tag.id, trackMutation),
        onDelete: trackMutation => deleteTag(tag.id, trackMutation)
    };

    return (
        <EntityListRow
            testID={TagCardSelector.Card(tag.title)}
            entity={tag}
            left={<TagMonogram title={tag.title} />}
            usage={usage}
            onOpen={handleOpen}
            operations={operations}
            isFirst={isFirst}
            isLast={isLast}
        />
    );
};
