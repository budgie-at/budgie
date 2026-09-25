import { UserIconNameEnum } from '@budgie/contracts';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxClusterCardSelector } from '../categorize-inbox-cluster-card/categorize-inbox-cluster-card.selector';

interface Props {
    readonly clusterKey: string;
}

export const CategorizeInboxClusterExpandToggle = ({ clusterKey }: Props) => {
    const { expandedClusterKey, toggleExpanded } = useCategorizeInboxContext();

    const handleTogglePress = () => void toggleExpanded(clusterKey);

    const isExpanded = expandedClusterKey === clusterKey;
    const expandToggleIcon = isExpanded ? UserIconNameEnum.ChevronUp : UserIconNameEnum.ChevronDown;

    return (
        <HapticPressable
            onPress={handleTogglePress}
            accessibilityRole="button"
            {...testID(CategorizeInboxClusterCardSelector.ExpandToggle, clusterKey)}
        >
            <Icon icon={expandToggleIcon} className="text-secondary-foreground" size={18} />
        </HapticPressable>
    );
};
