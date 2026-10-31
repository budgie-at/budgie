import { Children, Fragment, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/footnote-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/title-max-font-size-multiplier.constant';
import { useIsAccessibilityTextSize } from '../../hook/use-is-accessibility-text-size.hook';

interface Props {
    readonly title: string;
    readonly footnote?: string;
    readonly children: ReactNode;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const StatsSection = ({ title, footnote, children }: Props) => {
    const isStacked = useIsAccessibilityTextSize();

    const separatorClassName = isStacked ? 'ml-3xl h-hairline bg-surface-separator' : 'ml-[60px] h-hairline bg-surface-separator';

    return (
        <View className="gap-y-md">
            <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                className="px-3xl text-lg font-semibold text-primary"
            >
                {title}
            </Text>

            <View className="overflow-hidden rounded-3xl bg-grouped-surface-row" style={continuousCorners}>
                {Children.toArray(children).map((child, index) => (
                    <Fragment key={index}>
                        {index > 0 ? <View className={separatorClassName} /> : null}
                        {child}
                    </Fragment>
                ))}
            </View>

            {isNotEmptyString(footnote) ? (
                <Text maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className="px-3xl text-[13px] text-secondary-foreground">
                    {footnote}
                </Text>
            ) : null}
        </View>
    );
};
