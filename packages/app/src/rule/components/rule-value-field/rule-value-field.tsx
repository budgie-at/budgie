import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';

import type { ReactNode } from 'react';

interface Props {
    readonly isFocused: boolean;
    readonly hint: string | null;
    readonly isHintWarning: boolean;
    readonly children: ReactNode;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const RuleValueField = ({ isFocused, hint, isHintWarning, children }: Props) => {
    const surfaceClassName = cn(
        'min-h-[44px]',
        'flex-row',
        'items-center',
        'rounded-xl',
        'border',
        'bg-surface-fill',
        'px-lg',
        isFocused ? 'border-primary/60' : 'border-transparent'
    );
    const hintClassName = isHintWarning ? 'pt-xs text-[13px] text-warning-foreground' : 'pt-xs text-[13px] text-secondary-foreground';

    return (
        <View className="flex-1">
            <View className={surfaceClassName} style={CONTINUOUS_CORNERS}>
                {children}
            </View>
            {isNotEmptyString(hint) ? <Text className={hintClassName}>{hint}</Text> : null}
        </View>
    );
};
