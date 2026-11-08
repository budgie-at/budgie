import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly labelClassName?: string;
    readonly accessibilityLabel?: string;
    readonly children: ReactNode;
    readonly testID: string;
}

export const AdjustmentBalanceRow = ({
    label,
    value,
    children,
    testID,
    accessibilityLabel = label,
    labelClassName = 'text-[17px] text-secondary-foreground'
}: Props) => {
    const { t } = useLingui();
    const spokenLabel = value === '—' ? accessibilityLabel : `${accessibilityLabel}, ${value}`;
    const accessibilityValue = value === '—' ? { text: t`Not set` } : void 0;

    return (
        <View
            accessible
            accessibilityLabel={spokenLabel}
            accessibilityValue={accessibilityValue}
            testID={testID}
            className="flex-row flex-wrap items-center justify-between gap-x-lg gap-y-[2px] px-lg py-[8px]"
        >
            <Text className={cn('max-w-full', labelClassName)} maxFontSizeMultiplier={1.3}>
                {label}
            </Text>
            <View className="min-w-0 max-w-full items-start" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {children}
            </View>
        </View>
    );
};
