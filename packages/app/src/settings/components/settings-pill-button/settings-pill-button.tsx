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
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export const SettingsPillButton = ({ label, variant, onPress, isLoading = false, testID }: Props) => {
    const backgroundClassName = variant === 'cta' ? 'bg-cta-background' : 'bg-surface-fill';
    const labelClassName = variant === 'cta' ? 'text-cta-foreground' : 'text-primary';
    const accessibilityState = { busy: isLoading };
    const content = (
        <LoadingContent isLoading={isLoading}>
            <Text className={cn('text-[15px] font-semibold', labelClassName)} numberOfLines={1}>
                {label}
            </Text>
        </LoadingContent>
    );

    if (!isDefined(onPress)) {
        return (
            <View
                className={cn('min-h-[30px] min-w-[92px] items-center justify-center rounded-full px-xl py-xs', backgroundClassName)}
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
                'min-h-[30px] min-w-[92px] items-center justify-center rounded-full px-xl py-xs active:opacity-70',
                backgroundClassName
            )}
            style={CONTINUOUS_CORNERS}
            hitSlop={HIT_SLOP}
            onPress={onPress}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={accessibilityState}
            testID={testID}
        >
            {content}
        </HapticPressable>
    );
};
