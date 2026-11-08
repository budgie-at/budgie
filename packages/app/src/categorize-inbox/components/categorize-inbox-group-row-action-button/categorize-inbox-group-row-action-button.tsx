import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';

interface Props {
    readonly title: string;
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

const BUTTON_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 } as const;
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const CategorizeInboxGroupRowActionButton = ({ title, label, isDisabled, onPress, testID }: Props) => (
    <HapticPressable
        className="min-h-[32px] min-w-[52px] items-center justify-center self-center rounded-full bg-surface-disc px-md py-[6px] active:opacity-70"
        style={CONTINUOUS_CORNERS}
        hitSlop={BUTTON_HIT_SLOP}
        disabled={isDisabled}
        onPress={onPress}
        pressFeedback={HapticPressFeedbackEnum.COMMIT}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
    >
        <Text className="text-center text-[15px] leading-[20px] font-semibold text-primary" numberOfLines={2}>
            {title}
        </Text>
    </HapticPressable>
);
