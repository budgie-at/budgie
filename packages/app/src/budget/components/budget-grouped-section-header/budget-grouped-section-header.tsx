import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly label: string;
    readonly trailing?: ReactNode;
    readonly testID?: string;
}

export const BudgetGroupedSectionHeader = ({ label, trailing, testID }: Props) => {
    const containerClassName = useIsLargeTextSize()
        ? 'items-start gap-y-xxs pl-3xl'
        : 'min-h-[44px] flex-row items-center justify-between gap-x-md pl-3xl';

    return (
        <View testID={testID} collapsable={false} className={containerClassName}>
            <Text
                className="min-w-0 shrink text-[15px] font-semibold text-primary"
                numberOfLines={2}
                maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                accessibilityRole="header"
            >
                {label}
            </Text>
            {isDefined(trailing) ? <View className="min-h-[44px] shrink-0 justify-center">{trailing}</View> : null}
        </View>
    );
};
