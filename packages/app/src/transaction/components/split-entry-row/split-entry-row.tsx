import { TransactionEntryCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
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

const AMOUNT_INPUT_WIDTH = 104;
const CIRCLE_ICON_SIZE = 44;
const CIRCLE_ICON_INNER_SIZE = 22;
const amountInputStyle = { textAlign: 'right' as const, fontSize: 17, fontWeight: '600' as const, fontVariant: ['tabular-nums' as const] };

export const SplitEntryRow = (props: Props) => {
    const { index, entry, currencySymbol, autoFocus, onAmountChange, onCategoryPress, children } = props;
    const { fontScale } = useWindowDimensions();
    const amountWidthStyle = { width: AMOUNT_INPUT_WIDTH * fontScale };
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
            <View className="flex-row items-center gap-x-xl px-3xl py-xl">
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
                        variant={iconVariant}
                        iconClassName={titleClassName}
                    />
                    <Text className={cn('text-md font-semibold flex-1', titleClassName)} numberOfLines={2} ellipsizeMode="tail">
                        {categoryTitle}
                    </Text>
                </HapticPressable>

                <View className="max-w-[45%] justify-center" style={amountWidthStyle}>
                    <AmountInput
                        value={entry.amount}
                        onChangeValue={onAmountChange}
                        inputClassName="text-primary border-0 h-auto min-h-[44px] px-0"
                        placeholderTextColorClassName="accent-primary/40"
                        borderless
                        autoFocus={autoFocus}
                        selectTextOnFocus
                        style={amountInputStyle}
                        valuePrefix={currencySymbol}
                        placeholder={`${currencySymbol}0.00`}
                        minimumDecimalPlaces={DEFAULT_DECIMAL_PLACES}
                        testID={SplitEntryRowSelector.Amount(index)}
                    />
                </View>

                {children}
            </View>
        </Animated.View>
    );
};
