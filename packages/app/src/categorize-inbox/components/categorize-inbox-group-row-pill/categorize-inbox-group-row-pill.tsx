import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { CategorizeInboxTonalCapsule } from '../categorize-inbox-tonal-capsule/categorize-inbox-tonal-capsule';

import type { CategorizeInboxTonalCapsuleVariantEnum } from '../../enum/categorize-inbox-tonal-capsule-variant.enum';

interface Props {
    readonly variant: CategorizeInboxTonalCapsuleVariantEnum;
    readonly text: string;
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

const PILL_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 } as const;

export const CategorizeInboxGroupRowPill = ({ variant, text, label, isDisabled, onPress, testID }: Props) => (
    <HapticPressable
        className="active:opacity-70"
        hitSlop={PILL_HIT_SLOP}
        disabled={isDisabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
    >
        <CategorizeInboxTonalCapsule label={text} variant={variant} />
    </HapticPressable>
);
