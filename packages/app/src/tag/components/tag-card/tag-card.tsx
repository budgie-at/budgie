import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { EntityListRow } from '../../../@generic/component/entity-list-row/entity-list-row';
import { useMergeTag } from '../../hooks/use-merge-tag.hook';

import { TagCardSelector } from './tag-card.selector';

import type { EntityUsageInterface } from '../../../@generic/interface/entity-usage.interface';

interface Props {
    readonly tag: TagEntityInterface;
    readonly usage: EntityUsageInterface | undefined;
    readonly isFirst: boolean;
    readonly isLast: boolean;
    readonly onOpen: (tag: TagEntityInterface) => void;
}

export const TagCard = ({ onOpen, tag, usage, isFirst, isLast }: Props) => {
    const mergeTag = useMergeTag();
    const handleOpen = () => void onOpen(tag);
    const handleMerge = () => mergeTag(tag.id);

    return (
        <EntityListRow
            testID={TagCardSelector.Card(tag.title)}
            left={
                <CircleIcon
                    icon={UserIconNameEnum.Tag}
                    variant="secondary"
                    size={36}
                    iconSize={18}
                    radius={18}
                    border={false}
                    className="bg-surface-disc"
                />
            }
            title={tag.title}
            usage={usage}
            onOpen={handleOpen}
            onMerge={handleMerge}
            isFirst={isFirst}
            isLast={isLast}
        />
    );
};
