import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { cn } from '../../../@generic/utils/cn.util';
import { TransactionFeeModalContentSelector } from '../transaction-fee-modal-content/transaction-fee-modal-content.selector';

interface Props {
    readonly isDisabled: boolean;
    readonly onPress: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const TransactionFeeSaveButton = ({ isDisabled, onPress }: Props) => {
    const accessibilityState = { disabled: isDisabled };
    const backgroundClassName = isDisabled ? 'bg-cta-disabled-background' : 'bg-cta-background active:opacity-80';
    const contentClassName = isDisabled ? 'text-cta-disabled-foreground' : 'text-cta-foreground';

    return (
        <HapticPressable
            onPress={onPress}
            pressFeedback={HapticPressFeedbackEnum.COMMIT}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            className={cn('min-h-[52px] items-center justify-center rounded-3xl px-xl py-md', backgroundClassName)}
            style={CONTINUOUS_CORNERS}
            testID={TransactionFeeModalContentSelector.SaveButton}
        >
            <Text className={cn('text-center text-[17px] font-semibold', contentClassName)}>
                <Trans>Save fee</Trans>
            </Text>
        </HapticPressable>
    );
};
