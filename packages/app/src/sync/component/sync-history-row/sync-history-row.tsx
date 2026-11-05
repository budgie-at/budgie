import { UserIconNameEnum } from '@budgie/contracts';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';

import { SyncHistoryRowSelector } from './sync-history-row.selector';

import type { SyncHistoryDepthEnum } from '@budgie/sync';

interface Props {
    readonly depth: SyncHistoryDepthEnum;
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly hint: string;
    readonly isSelected: boolean;
    readonly onSelect: (depth: SyncHistoryDepthEnum) => void;
}

export const SyncHistoryRow = ({ depth, icon, title, hint, isSelected, onSelect }: Props) => {
    const checkMark = isSelected ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : <></>;
    const pressableProps = { accessibilityState: { selected: isSelected } };
    const handlePress = () => {
        onSelect(depth);
    };

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={icon} />}
            title={title}
            subtitle={hint}
            right={checkMark}
            onPress={handlePress}
            pressableProps={pressableProps}
            testID={SyncHistoryRowSelector.Row(depth)}
        />
    );
};
