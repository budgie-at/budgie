import { useLingui } from '@lingui/react/macro';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EmptyFn, isPositiveNumber } from '@rnw-community/shared';

import { EASE_OUT, MOTION_FAST_DURATION } from '../../../constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../../enum/haptic-press-feedback.enum';
import { HapticPressable } from '../../haptic-pressable/haptic-pressable';

interface Props {
    readonly selectedCount: number;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
    readonly isLoading: boolean;
    readonly selectAllTestID?: string;
    readonly deselectAllTestID?: string;
}

const ENTERING = FadeIn.duration(MOTION_FAST_DURATION).easing(EASE_OUT);
const TOGGLE_WIDTH = 116;

export const FilterSheetBulkToggle = (props: Props) => {
    const { t } = useLingui();
    const { selectedCount, onSelectAll, onDeselectAll, isLoading, selectAllTestID, deselectAllTestID } = props;
    const hasSelection = isPositiveNumber(selectedCount);
    const disabled = isLoading && !hasSelection;
    const handlePress = hasSelection ? onDeselectAll : onSelectAll;
    const testID = hasSelection ? deselectAllTestID : selectAllTestID;
    const pressableStyle = { width: TOGGLE_WIDTH };
    const label = hasSelection ? t`Clear` : t`All`;
    const textKey = hasSelection ? 'deselect' : 'select';
    const disabledClassName = disabled ? 'opacity-50' : '';

    return (
        <HapticPressable
            onPress={handlePress}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            testID={testID}
            style={pressableStyle}
            disabled={disabled}
            className={`h-[52px] items-center justify-center rounded-3xl border border-secondary-corner bg-ghost-background px-xl ${disabledClassName}`}
        >
            <Animated.Text key={textKey} entering={ENTERING} className="text-md font-semibold text-secondary-foreground">
                {label}
            </Animated.Text>
        </HapticPressable>
    );
};
