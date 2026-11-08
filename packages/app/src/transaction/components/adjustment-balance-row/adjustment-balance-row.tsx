import { useLingui } from '@lingui/react/macro';
import { Text, useWindowDimensions, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly value: string | null;
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
    const isStacked = useWindowDimensions().fontScale >= TRANSACTION_LARGE_TEXT_SCALE;
    const rowClassName = isStacked ? 'items-start' : 'flex-row items-center justify-between';
    const spokenLabel = isDefined(value) ? `${accessibilityLabel}, ${value}` : accessibilityLabel;
    const accessibilityValue = isDefined(value) ? void 0 : { text: t`Not set` };

    return (
        <View
            accessible
            accessibilityLabel={spokenLabel}
            accessibilityValue={accessibilityValue}
            testID={testID}
            className={cn('gap-x-lg gap-y-[2px] px-3xl py-[6px]', rowClassName)}
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
