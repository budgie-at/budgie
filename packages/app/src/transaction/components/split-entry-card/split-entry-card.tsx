import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly categoryId: number;
    readonly amount: number;
    readonly currencySymbol: string;
    readonly isActive: boolean;
    readonly index: number;
    readonly onPress: () => void;
}

const ANIMATION_DELAY_STEP = 50;

export const SplitEntryCard = (props: Props) => {
    const { categoryId, amount, currencySymbol, isActive, index, onPress } = props;

    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const hasCategorySelected = isPositiveNumber(categoryId);
    const { category } = useGetCategoryByIdQuery(categoryId);

    const categoryIcon = hasCategorySelected && category ? category.icon : UserIconNameEnum.Circle;
    const categoryTitle = hasCategorySelected && category ? category.title : '';
    const formattedAmount = formatDigits(amount, currencySymbol);
    const activeClassName = isActive ? 'border border-default-foreground' : 'border border-transparent';
    const animationDelay = index * ANIMATION_DELAY_STEP;

    return (
        <Animated.View entering={FadeInUp.delay(animationDelay)} exiting={FadeOutDown.delay(animationDelay)} layout={LinearTransition}>
            <HapticPressable
                className={cn('flex-row items-center gap-x-md bg-secondary-background rounded-2xl px-md py-sm', activeClassName)}
                onPress={onPress}
            >
                <CircleIcon icon={categoryIcon} size={36} iconSize={18} border={false} variant="ghost" />

                <View className="flex-1">
                    <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                        {categoryTitle}
                    </Text>
                </View>

                <Text className="text-sm font-semibold text-primary">{formattedAmount}</Text>
            </HapticPressable>
        </Animated.View>
    );
};
