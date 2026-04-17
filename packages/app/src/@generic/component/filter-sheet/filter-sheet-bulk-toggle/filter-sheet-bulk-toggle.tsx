import { Trans } from '@lingui/react/macro';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { EmptyFn, isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../haptic-pressable/haptic-pressable';

interface Props {
    readonly selectedCount: number;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
    readonly selectAllTestID?: string;
    readonly deselectAllTestID?: string;
}

const ANIMATION_DURATION = 180;
const ENTERING = FadeIn.duration(ANIMATION_DURATION);
const EXITING = FadeOut.duration(ANIMATION_DURATION);
const LAYOUT = LinearTransition.duration(ANIMATION_DURATION);
const TOGGLE_MIN_WIDTH = 84;

export const FilterSheetBulkToggle = (props: Props) => {
    const { selectedCount, onSelectAll, onDeselectAll, selectAllTestID, deselectAllTestID } = props;
    const hasSelection = isPositiveNumber(selectedCount);
    const handlePress = hasSelection ? onDeselectAll : onSelectAll;
    const testID = hasSelection ? deselectAllTestID : selectAllTestID;
    const pressableStyle = { minWidth: TOGGLE_MIN_WIDTH };

    return (
        <HapticPressable
            onPress={handlePress}
            testID={testID}
            style={pressableStyle}
            className="h-[52px] items-center justify-center rounded-3xl border border-secondary-corner bg-ghost-background px-xl"
        >
            {hasSelection ? (
                <Animated.Text
                    key="deselect"
                    entering={ENTERING}
                    exiting={EXITING}
                    layout={LAYOUT}
                    className="text-md font-semibold text-secondary-foreground"
                >
                    <Trans>Clear</Trans>
                </Animated.Text>
            ) : (
                <Animated.Text
                    key="select"
                    entering={ENTERING}
                    exiting={EXITING}
                    layout={LAYOUT}
                    className="text-md font-semibold text-secondary-foreground"
                >
                    <Trans>All</Trans>
                </Animated.Text>
            )}
        </HapticPressable>
    );
};
