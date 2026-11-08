import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { TransactionInfoActionLabel } from '../transaction-info-action-label/transaction-info-action-label';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly label: string;
    readonly onPress: () => void;
    readonly testID: string;
    readonly colorClassName?: string;
    readonly pressFeedback?: HapticPressFeedbackEnum;
}

export const TransactionInfoActionRow = ({ icon, label, onPress, testID, colorClassName, pressFeedback }: Props) => (
    <HapticPressable
        pressedScale={1}
        className="active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        pressFeedback={pressFeedback}
        testID={testID}
    >
        <TransactionInfoActionLabel icon={icon} label={label} colorClassName={colorClassName} />
    </HapticPressable>
);
