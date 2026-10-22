import { ActivityIndicator, Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly variant: 'cta' | 'secondary';
    readonly isLoading?: boolean;
    readonly testID?: string;
}

export const SettingsPillButton = ({ label, onPress, variant, isLoading = false, testID }: Props) => {
    const containerClassName = variant === 'cta' ? 'bg-cta-background' : 'bg-secondary-corner';
    const labelClassName = variant === 'cta' ? 'text-cta-foreground' : 'text-primary';

    return (
        <HapticPressable
            className={cn('min-w-20 items-center rounded-full px-xl py-md', containerClassName)}
            onPress={onPress}
            disabled={isLoading}
            accessibilityRole="button"
            testID={testID}
        >
            {isLoading ? <ActivityIndicator size="small" /> : <Text className={cn('text-xs font-semibold', labelClassName)}>{label}</Text>}
        </HapticPressable>
    );
};
