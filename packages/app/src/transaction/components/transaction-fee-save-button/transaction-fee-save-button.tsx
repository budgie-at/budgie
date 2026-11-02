import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { TransactionFeeModalContentSelector } from '../transaction-fee-modal-content/transaction-fee-modal-content.selector';

interface Props {
    readonly isDisabled: boolean;
    readonly onPress: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const TransactionFeeSaveButton = ({ isDisabled, onPress }: Props) => {
    const { t } = useLingui();
    const accessibilityState = { disabled: isDisabled };
    const disabledClassName = isDisabled ? 'opacity-40' : 'active:opacity-80';

    return (
        <HapticPressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            className={cn('min-h-[52px] items-center justify-center rounded-full px-5xl py-md bg-cta-background', disabledClassName)}
            style={CONTINUOUS_CORNERS}
            testID={TransactionFeeModalContentSelector.SaveButton}
        >
            <Text className="text-center text-[17px] font-semibold text-cta-foreground">{t`Save fee`}</Text>
        </HapticPressable>
    );
};
