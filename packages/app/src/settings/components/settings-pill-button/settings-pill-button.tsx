import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { cn } from '../../../@generic/utils/cn.util';

import type { AccessibilityProps } from 'react-native';

interface Props extends Pick<AccessibilityProps, 'accessibilityLabel' | 'accessibilityHint'> {
    readonly label: string;
    readonly variant: 'cta' | 'secondary';
    readonly onPress?: () => void;
    readonly isLoading?: boolean;
    readonly testID?: string;
    readonly isDisabled?: boolean;
    readonly size?: 'md' | 'sm';
    readonly className?: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export const SettingsPillButton = (props: Props) => {
    const {
        label,
        variant,
        onPress,
        isLoading = false,
        isDisabled = false,
        testID,
        accessibilityLabel = label,
        accessibilityHint,
        size = 'md',
        className
    } = props;
    const backgroundClassName = variant === 'cta' ? 'bg-cta-background' : 'bg-surface-fill';
    const pressFeedback = variant === 'cta' ? HapticPressFeedbackEnum.COMMIT : HapticPressFeedbackEnum.IMPACT;
    const labelClassName = variant === 'cta' ? 'text-cta-foreground' : 'text-primary';
    const disabled = isDisabled || isLoading;
    const accessibilityState = { busy: isLoading, disabled };
    const minWidthClassName = size === 'sm' ? 'min-w-[76px] min-h-[28px] px-lg' : 'min-w-[92px] min-h-[30px] px-xl';
    const labelSizeClassName = size === 'sm' ? 'text-[14px]' : 'text-[15px]';
    const content = (
        <LoadingContent isLoading={isLoading}>
            <Text className={cn('font-semibold', labelSizeClassName, labelClassName)} numberOfLines={1}>
                {label}
            </Text>
        </LoadingContent>
    );

    if (!isDefined(onPress) && !isDisabled) {
        return (
            <View
                className={cn('items-center justify-center rounded-full py-xs', minWidthClassName, backgroundClassName, className)}
                style={CONTINUOUS_CORNERS}
                testID={testID}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
            >
                {content}
            </View>
        );
    }

    return (
        <HapticPressable
            className={cn(
                'items-center justify-center rounded-full py-xs active:opacity-70',
                minWidthClassName,
                backgroundClassName,
                className,
                isDisabled && 'opacity-40'
            )}
            style={CONTINUOUS_CORNERS}
            hitSlop={HIT_SLOP}
            onPress={onPress}
            pressFeedback={pressFeedback}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            accessibilityState={accessibilityState}
            testID={testID}
        >
            {content}
        </HapticPressable>
    );
};
