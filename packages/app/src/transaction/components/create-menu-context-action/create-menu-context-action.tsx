import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BUTTON_PRESSED_SCALE } from '../../../@generic/constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID: string;
    readonly onPress: () => void;
}

const ICON_SIZE = 22;

export const CreateMenuContextAction = ({ icon, label, testID, onPress }: Props) => (
    <HapticPressable
        className="h-18 flex-1 flex-row items-center justify-center gap-md rounded-full bg-primary px-2xl"
        collapsable={false}
        onPress={onPress}
        pressedScale={BUTTON_PRESSED_SCALE}
        pressFeedback={HapticPressFeedbackEnum.COMMIT}
        testID={testID}
    >
        <Icon className="text-primary-reverse" icon={icon} size={ICON_SIZE} />
        <Text
            className="shrink text-md font-semibold text-primary-reverse"
            numberOfLines={1}
            {...testIDProps(testID, TestIDPartEnum.LABEL)}
        >
            {label}
        </Text>
    </HapticPressable>
);
