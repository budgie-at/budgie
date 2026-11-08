import { UserIconType } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CategoryFormHeroIcon } from '../category-form-hero-icon/category-form-hero-icon';

interface Props {
    readonly icon: UserIconType;
    readonly title: string;
    readonly fallbackTitle: string;
    readonly subtitle: string;
    readonly onIconPress: () => void;
}

const titleVariants = cva('text-center text-[28px] font-semibold leading-[34px]', {
    variants: { hasTitle: { true: 'text-primary', false: 'text-secondary-foreground' } }
});
const MINIMUM_TITLE_FONT_SCALE = 0.6;

export const CategoryFormHero = ({ icon, title, fallbackTitle, subtitle, onIconPress }: Props) => {
    const trimmedTitle = title.trim();
    const hasTitle = isNotEmptyString(trimmedTitle);
    const displayTitle = hasTitle ? trimmedTitle : fallbackTitle;
    const titleClassName = titleVariants({ hasTitle });

    return (
        <View className="items-center gap-y-lg pt-md">
            <CategoryFormHeroIcon icon={icon} onPress={onIconPress} />
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
