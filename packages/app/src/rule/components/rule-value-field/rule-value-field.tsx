import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

import type { ReactNode } from 'react';

interface Props {
    readonly isFocused: boolean;
    readonly hint: string | null;
    readonly isHintWarning: boolean;
    readonly children: ReactNode;
    readonly onPress?: () => void;
    readonly accessibilityLabel?: string;
    readonly testID?: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const RuleValueField = ({ isFocused, hint, isHintWarning, children, onPress, accessibilityLabel, testID }: Props) => {
    const Surface = isDefined(onPress) ? HapticPressable : View;
    const surfaceClassName = cn(
        'min-h-[44px]',
        'flex-row',
        'items-center',
        'gap-x-md',
        'rounded-xl',
        'border',
        'bg-surface-fill',
        'px-lg',
        'active:opacity-70',
        isFocused ? 'border-primary/60' : 'border-transparent',
        isHintWarning && !isFocused && 'border-warning-foreground/50'
    );
    const hintClassName = isHintWarning ? 'shrink text-[13px] text-warning-foreground' : 'shrink text-[13px] text-secondary-foreground';

    return (
        <View className="flex-1">
            <Surface
                className={surfaceClassName}
                style={CONTINUOUS_CORNERS}
                {...(isDefined(onPress) && { onPress, accessibilityRole: 'button' as const, accessibilityLabel, testID })}
            >
                {children}
            </Surface>
            {isNotEmptyString(hint) ? (
                <View className="flex-row items-center gap-x-xs pt-xs">
                    {isHintWarning ? <Icon icon={UserIconNameEnum.CircleAlert} size={14} className="text-warning-foreground" /> : null}
                    <Text className={hintClassName}>{hint}</Text>
                </View>
            ) : null}
        </View>
    );
};
