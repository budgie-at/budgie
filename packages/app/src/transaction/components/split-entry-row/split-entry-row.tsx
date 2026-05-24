import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOutDown, LinearTransition } from 'react-native-reanimated';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';

import { SplitEntryRowSelector } from './split-entry-row.selector';

interface Props {
    readonly index: number;
    readonly categoryId: number;
    readonly amount: number;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly canDelete: boolean;
    readonly autoFocus: boolean;
    readonly onAmountChange: (amount: number) => void;
    readonly onCategoryPress: () => void;
    readonly onDelete: () => void;
}

const CIRCLE_ICON_SIZE = 44;
const CIRCLE_ICON_INNER_SIZE = 22;
const DELETE_ICON_SIZE = 28;
const DELETE_ICON_INNER_SIZE = 14;
const AMOUNT_INPUT_WIDTH = 90;
const amountInputStyle = { width: AMOUNT_INPUT_WIDTH, textAlign: 'right' as const, fontSize: 15, fontWeight: '600' as const };

export const SplitEntryRow = (props: Props) => {
    const { index, categoryId, amount, currencySymbol, variant, canDelete, autoFocus, onAmountChange, onCategoryPress, onDelete } = props;

    const { t } = useLingui();

    const hasCategorySelected = isPositiveNumber(categoryId);
    const { category } = useGetCategoryByIdQuery(categoryId);

    const categoryIcon = hasCategorySelected && isDefined(category) ? category.icon : UserIconNameEnum.Circle;
    const categoryTitle = isDefined(category) ? category.title : t`Select category`;
    const titleClassName = hasCategorySelected ? 'text-primary' : 'text-secondary-foreground';

    return (
        <Animated.View entering={FadeIn} exiting={FadeOutDown} layout={LinearTransition}>
            <View className="flex-row items-center gap-x-xl rounded-3xl bg-secondary-background px-3xl py-xl">
                <HapticPressable
                    onPress={onCategoryPress}
                    className="flex-row items-center gap-x-xl flex-1"
                    testID={SplitEntryRowSelector.Category(index)}
                >
                    <CircleIcon
                        icon={categoryIcon}
                        size={CIRCLE_ICON_SIZE}
                        iconSize={CIRCLE_ICON_INNER_SIZE}
                        border={false}
                        variant={variant}
                    />
                    <Text className={cn('text-md font-semibold flex-1', titleClassName)} numberOfLines={1}>
                        {categoryTitle}
                    </Text>
                </HapticPressable>

                <AmountInput
                    value={amount}
                    onChangeValue={onAmountChange}
                    inputClassName="text-primary border-0 h-auto"
                    borderless
                    autoFocus={autoFocus}
                    selectTextOnFocus
                    style={amountInputStyle}
                    valuePrefix={`${currencySymbol} `}
                    placeholder={`${currencySymbol} 0`}
                    testID={SplitEntryRowSelector.Amount(index)}
                />

                {canDelete ? (
                    <HapticPressable onPress={onDelete} testID={SplitEntryRowSelector.Delete(index)}>
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
