import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import type { ReactNode } from 'react';

interface Props {
    readonly icon: ReactNode;
    readonly title: string;
    readonly fallbackTitle: string;
    readonly subtitle: string;
}

const titleVariants = cva('text-center text-[28px] font-semibold leading-[34px]', {
    variants: { hasTitle: { true: 'text-primary', false: 'text-secondary-foreground' } }
});
const MINIMUM_TITLE_FONT_SCALE = 0.6;

export const EntityFormHero = ({ icon, title, fallbackTitle, subtitle }: Props) => {
    const trimmedTitle = title.trim();
    const hasTitle = isNotEmptyString(trimmedTitle);
    const displayTitle = hasTitle ? trimmedTitle : fallbackTitle;
    const titleClassName = titleVariants({ hasTitle });

    return (
        <View className="items-center gap-y-lg pt-md">
            {icon}
            <View className="items-center gap-y-xs self-stretch px-xl">
                <Text
                    className={titleClassName}
                    accessibilityRole="header"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={MINIMUM_TITLE_FONT_SCALE}
                >
                    {displayTitle}
                </Text>
                <Text className="text-center text-[15px] leading-[20px] text-secondary-foreground">{subtitle}</Text>
            </View>
        </View>
    );
};
