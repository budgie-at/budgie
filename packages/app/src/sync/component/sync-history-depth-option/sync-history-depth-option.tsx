import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { Icon } from '../../../@generic/component/icon/icon';

import { SyncHistoryDepthOptionSelector } from './sync-history-depth-option.selector';

import type { SyncHistoryDepthEnum } from '../../enum/sync-history-depth.enum';

interface Props {
    readonly depth: SyncHistoryDepthEnum;
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly hint: string;
    readonly isSelected: boolean;
    readonly onSelect: (depth: SyncHistoryDepthEnum) => void;
}

export const SyncHistoryDepthOption = ({ depth, icon, title, hint, isSelected, onSelect }: Props) => {
    const handleSelect = () => {
        onSelect(depth);
    };

    const checkIcon = isSelected ? <Icon icon={UserIconNameEnum.Check} className="text-primary" size={20} /> : null;

    return (
        <HorizontalCell
            size="md"
            onPress={handleSelect}
            left={<CircleIcon icon={icon} variant="primary" size={40} iconSize={18} />}
            right={checkIcon}
            testID={SyncHistoryDepthOptionSelector.Row(depth)}
        >
            <Text className="text-md font-semibold text-primary">{title}</Text>
            <Text className="mt-1 text-sm text-secondary-foreground">{hint}</Text>
        </HorizontalCell>
    );
};
