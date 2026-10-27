import { UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly onPress: () => void;
    readonly testID: string;
}

export const AccountActionButton = ({ icon, onPress, testID }: Props) => (
    <HapticPressable testID={testID} onPress={onPress}>
        <CircleIcon variant="positive" icon={icon} />
    </HapticPressable>
);
