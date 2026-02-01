import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';

interface Props {
    readonly categoryId: number;
    readonly amount: number;
    readonly currencySymbol: string;
    readonly index: number;
    readonly canDelete: boolean;
    readonly autoFocus: boolean;
    readonly onAmountChange: (index: number, amount: number) => void;
    readonly onCategoryPress: () => void;
    readonly onDelete: () => void;
}

const ANIMATION_DELAY_STEP = 50;
const CIRCLE_ICON_SIZE = 36;
const CIRCLE_ICON_INNER_SIZE = 18;
const DELETE_ICON_SIZE = 24;
const DELETE_ICON_INNER_SIZE = 12;

export const SplitEntryRow = (props: Props) => {
    const { categoryId, amount, currencySymbol, index, canDelete, autoFocus, onAmountChange, onCategoryPress, onDelete } = props;

    const { t } = useLingui();

    const hasCategorySelected = isPositiveNumber(categoryId);
    const { category } = useGetCategoryByIdQuery(categoryId);

    const categoryIcon = hasCategorySelected && category ? category.icon : UserIconNameEnum.Circle;
    const categoryTitle = hasCategorySelected && category ? category.title : t`Select category`;
    const titleClassName = hasCategorySelected ? 'text-primary' : 'text-tertiary';
    const animationDelay = index * ANIMATION_DELAY_STEP;

    const handleAmountChange = (value: number) => {
        onAmountChange(index, value);
    };

    return (
        <Animated.View entering={FadeInUp.delay(animationDelay)} exiting={FadeOutDown} layout={LinearTransition}>
            <View className="flex-row items-center gap-x-sm rounded-2xl bg-secondary-background px-md py-sm">
                <HapticPressable onPress={onCategoryPress} className="flex-row items-center gap-x-sm flex-1">
                    <CircleIcon
                        icon={categoryIcon}
                        size={CIRCLE_ICON_SIZE}
                        iconSize={CIRCLE_ICON_INNER_SIZE}
                        border={false}
                        variant="ghost"
                    />
                    <Text className={cn('text-sm font-medium flex-1', titleClassName)} numberOfLines={1}>
                        {categoryTitle}
                    </Text>
                </HapticPressable>

                <View className="flex-row items-center">
                    <Text className="text-xs text-tertiary mr-xs">{currencySymbol}</Text>
                    <AmountInput
                        value={amount}
                        onChangeValue={handleAmountChange}
                        inputClassName="text-primary border-0 h-auto"
                        borderless
                        autoFocus={autoFocus}
                        selectTextOnFocus
                        style={{ width: 80, textAlign: 'right', fontSize: 14, fontWeight: '600' }}
                    />
                </View>

                {canDelete ? (
                    <HapticPressable onPress={onDelete} className="ml-xs">
                        <CircleIcon
                            icon={UserIconNameEnum.X}
                            size={DELETE_ICON_SIZE}
                            iconSize={DELETE_ICON_INNER_SIZE}
                            border={false}
                            variant="ghost"
                        />
                    </HapticPressable>
                ) : null}
            </View>
        </Animated.View>
    );
};
