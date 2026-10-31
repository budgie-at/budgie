import { Text, View } from 'react-native';

import { RUNWAY_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/runway-max-font-size-multiplier.constant';
import { RunwayCard } from '../runway-card/runway-card';

import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly children: ReactNode;
    readonly accessory?: ReactNode;
    readonly footnote?: ReactNode;
    readonly testID?: string;
}

export const RunwaySection = ({ title, children, accessory, footnote, testID }: Props) => (
    <View collapsable={false} testID={testID} className="gap-y-md">
        <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={RUNWAY_MAX_FONT_SIZE_MULTIPLIER}
            className="px-3xl text-lg font-semibold text-primary"
        >
            {title}
        </Text>

        {accessory}

        <RunwayCard>{children}</RunwayCard>

        {footnote}
    </View>
);
