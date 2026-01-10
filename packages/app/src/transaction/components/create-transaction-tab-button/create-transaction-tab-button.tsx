import { UserIconNameEnum } from '@budgie/contracts';

import { useAnimatedActionMenu } from '../../../@generic/component/animated-action-menu/animated-action-menu.context';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

const ICON_SIZE = 24;

export const CreateTransactionTabButton = () => {
    const { open } = useAnimatedActionMenu();

    return (
        <HapticPressable className="bg-primary rounded-full items-center justify-center w-14 h-14" onPress={open}>
            <Icon className="text-primary-reverse" icon={UserIconNameEnum.Plus} size={ICON_SIZE} />
        </HapticPressable>
    );
};
