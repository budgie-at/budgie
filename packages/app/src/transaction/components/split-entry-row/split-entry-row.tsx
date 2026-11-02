import { TransactionEntryCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOutDown, LinearTransition } from 'react-native-reanimated';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { DEFAULT_DECIMAL_PLACES } from '../../../i18n/constant/default-decimal-places.constant';

import { SplitEntryRowSelector } from './split-entry-row.selector';

interface Props {
    readonly index: number;
    readonly entry: Pick<TransactionEntryCreateInputInterface, 'categoryId' | 'amount'>;
    readonly currencySymbol: string;
    readonly autoFocus: boolean;
    readonly onAmountChange: (amount: number) => void;
    readonly onCategoryPress: () => void;
    readonly children?: ReactNode;
}

const ACCESSIBILITY_FONT_SCALE = 1.35;
const CIRCLE_ICON_SIZE = 44;
const CIRCLE_ICON_INNER_SIZE = 22;
const amountInputStyle = { textAlign: 'right' as const, fontSize: 17, fontWeight: '600' as const, fontVariant: ['tabular-nums' as const] };

export const SplitEntryRow = (props: Props) => {
    const { index, entry, currencySymbol, autoFocus, onAmountChange, onCategoryPress, children } = props;
    const { fontScale } = useWindowDimensions();
    const [isAmountFocused, setIsAmountFocused] = useState(false);
    const categoryLayoutClassName = fontScale >= ACCESSIBILITY_FONT_SCALE ? 'w-full' : 'flex-1';

    const handleAmountFocus = () => void setIsAmountFocused(true);
    const handleAmountBlur = () => void setIsAmountFocused(false);
    const categoryId = entry.categoryId ?? 0;

    const { t } = useLingui();
    const hasCategorySelected = isPositiveNumber(categoryId);
    const { category } = useGetCategoryByIdQuery(categoryId);

    const categoryIcon = hasCategorySelected && isDefined(category) ? category.icon : UserIconNameEnum.Circle;
    const categoryTitle = isDefined(category) ? category.title : t`Select category`;
    const titleClassName = hasCategorySelected ? 'text-primary' : 'text-warning-strong';
    const iconVariant = hasCategorySelected ? 'ghost' : 'warning';

    return (
        <Animated.View entering={FadeIn} exiting={FadeOutDown} layout={LinearTransition}>
            <View className="flex-row flex-wrap items-center gap-x-md gap-y-md px-xl py-xl">
                <HapticPressable
                    onPress={onCategoryPress}
                    className={cn('flex-row items-center gap-x-md min-h-[44px] min-w-[88px]', categoryLayoutClassName)}
                    testID={SplitEntryRowSelector.Category(index)}
                >
                    <CircleIcon
                        icon={categoryIcon}
                        size={CIRCLE_ICON_SIZE}
                        iconSize={CIRCLE_ICON_INNER_SIZE}
                        border={false}
                        variant={iconVariant}
                        iconClassName={titleClassName}
                    />
                    <Text className={cn('text-md font-semibold flex-1 shrink', titleClassName)} numberOfLines={1} ellipsizeMode="tail">
                        {categoryTitle}
                    </Text>
                </HapticPressable>

                <View
                    data-focused={isAmountFocused}
                    className="ml-auto min-h-[44px] min-w-[104px] max-w-full shrink flex-row items-center justify-end gap-x-[4px] rounded-full px-[8px] data-[focused=true]:bg-surface-fill"
                >
                    <Text className="text-primary text-[17px] font-semibold tabular-nums">{currencySymbol}</Text>
                    <AmountInput
                        value={entry.amount}
                        onChangeValue={onAmountChange}
                        inputClassName="text-primary border-0 h-auto min-h-[44px] shrink px-0"
                        placeholderTextColorClassName="accent-secondary-foreground"
                        onFocus={handleAmountFocus}
                        onBlur={handleAmountBlur}
                        hitSlop={22}
                        borderless
                        autoFocus={autoFocus}
                        selectTextOnFocus
                        style={amountInputStyle}
                        placeholder="0.00"
                        minimumDecimalPlaces={DEFAULT_DECIMAL_PLACES}
                        testID={SplitEntryRowSelector.Amount(index)}
                    />
                </View>

                {children}
            </View>
        </Animated.View>
    );
};
