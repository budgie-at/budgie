import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { CategorizeInboxGroupRowActionPill } from '../categorize-inbox-group-row-action-pill/categorize-inbox-group-row-action-pill';

interface Props {
    readonly title: string;
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

const BUTTON_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export const CategorizeInboxGroupRowActionButton = ({ title, label, isDisabled, onPress, testID }: Props) => (
    <HapticPressable
        className="active:opacity-70"
        hitSlop={BUTTON_HIT_SLOP}
        disabled={isDisabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
    >
        <CategorizeInboxGroupRowActionPill title={title} />
    </HapticPressable>
);
