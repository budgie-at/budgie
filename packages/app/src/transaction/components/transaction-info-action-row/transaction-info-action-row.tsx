import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TransactionInfoActionLabel } from '../transaction-info-action-label/transaction-info-action-label';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly label: string;
    readonly onPress: () => void;
    readonly testID: string;
    readonly colorClassName?: string;
}

export const TransactionInfoActionRow = ({ icon, label, onPress, testID, colorClassName }: Props) => (
    <HapticPressable
        className="active:scale-100 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        testID={testID}
    >
        <TransactionInfoActionLabel icon={icon} label={label} colorClassName={colorClassName} />
    </HapticPressable>
);
