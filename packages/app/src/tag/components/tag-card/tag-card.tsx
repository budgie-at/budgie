import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { useTagUsageQuery } from '../../query/use-tag-usage.query';

import { TagCardSelector } from './tag-card.selector';

interface Props {
    readonly tag: TagEntityInterface;
    readonly isFirst: boolean;
    readonly isLast: boolean;
    readonly onOpen: (tag: TagEntityInterface) => void;
}

export const TagCard = ({ onOpen, tag, isFirst, isLast }: Props) => {
    const formatUsage = useFormatEntityUsage();
    const usage = useTagUsageQuery(tag.id);
    const handleOpen = () => void onOpen(tag);

    return (
        <GroupedListItem isFirst={isFirst} isLast={isLast}>
            <GroupedListRow
                testID={TagCardSelector.Card(tag.title)}
                left={
                    <CircleIcon
                        icon={UserIconNameEnum.Tag}
                        variant="pink"
                        size={36}
                        iconSize={18}
                        radius={18}
                        border={false}
                        className={TONAL_DISC_BACKGROUND.pink}
                    />
                }
                title={tag.title}
                subtitle={formatUsage(usage)}
                onPress={handleOpen}
            />
        </GroupedListItem>
    );
};
