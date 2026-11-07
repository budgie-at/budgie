import { Text, useWindowDimensions, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { ADJUSTMENT_COMPACT_FONT_SCALE } from '../../constant/adjustment-compact-font-scale.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly labelClassName?: string;
    readonly children: ReactNode;
    readonly detail?: string | null;
    readonly detailClassName?: string;
    readonly testID: string;
}

export const AdjustmentBalanceRow = ({
    label,
    value,
    children,
    detail,
    detailClassName,
    testID,
    labelClassName = 'text-[17px] text-secondary-foreground'
}: Props) => {
    const isStacked = useWindowDimensions().fontScale > ADJUSTMENT_COMPACT_FONT_SCALE;
    const className = isStacked ? 'gap-y-[2px] px-lg py-[5px]' : 'flex-row items-center justify-between gap-x-lg px-lg py-[8px]';
    const accessibilityLabel = [label, value, detail].filter(isNotEmptyString).join(', ');
    const detailNode = isNotEmptyString(detail) ? (
        <Text className={detailClassName} maxFontSizeMultiplier={1.3}>
            {detail}
        </Text>
    ) : null;

    return (
        <View accessible accessibilityLabel={accessibilityLabel} testID={testID} className={className}>
            <Text className={labelClassName} maxFontSizeMultiplier={1.3}>
                {label}
            </Text>
            <View
                className="min-w-0 shrink items-end gap-y-[2px]"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                {children}
                {detailNode}
            </View>
        </View>
    );
};
