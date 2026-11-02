import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly variant: 'cta' | 'secondary';
    readonly onPress?: () => void;
    readonly isLoading?: boolean;
    readonly testID?: string;
    readonly accessibilityLabel?: string;
    readonly size?: 'md' | 'sm';
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export const SettingsPillButton = ({
    label,
    variant,
    onPress,
    isLoading = false,
    testID,
    accessibilityLabel = label,
    size = 'md'
}: Props) => {
    const backgroundClassName = variant === 'cta' ? 'bg-cta-background' : 'bg-surface-fill';
    const labelClassName = variant === 'cta' ? 'text-cta-foreground' : 'text-primary';
    const accessibilityState = { busy: isLoading };
    const minWidthClassName = size === 'sm' ? 'min-w-[76px] min-h-[28px] px-lg' : 'min-w-[92px] min-h-[30px] px-xl';
    const labelSizeClassName = size === 'sm' ? 'text-[14px]' : 'text-[15px]';
    const content = (
        <LoadingContent isLoading={isLoading}>
            <Text className={cn('font-semibold', labelSizeClassName, labelClassName)} numberOfLines={1}>
                {label}
            </Text>
        </LoadingContent>
    );

    if (!isDefined(onPress)) {
        return (
            <View
                className={cn('items-center justify-center rounded-full py-xs', minWidthClassName, backgroundClassName)}
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
            className={cn('items-center justify-center rounded-full py-xs active:opacity-70', minWidthClassName, backgroundClassName)}
            style={CONTINUOUS_CORNERS}
            hitSlop={HIT_SLOP}
            onPress={onPress}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            testID={testID}
        >
            {content}
        </HapticPressable>
    );
};
