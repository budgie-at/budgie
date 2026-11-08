import { TransactionEntryCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode, Ref, useState } from 'react';
import { Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { MOTION_FADE_IN, MOTION_FADE_OUT, MOTION_LAYOUT } from '../../../@generic/constant/motion.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { DEFAULT_DECIMAL_PLACES } from '../../../i18n/constant/default-decimal-places.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';

import { SplitEntryRowSelector } from './split-entry-row.selector';

interface Props {
    readonly index: number;
    readonly entry: Pick<TransactionEntryCreateInputInterface, 'categoryId' | 'amount'>;
    readonly currencySymbol: string;
    readonly autoFocus: boolean;
    readonly amountRef?: Ref<TextInput>;
    readonly onAmountChange: (amount: number) => void;
    readonly onCategoryPress: () => void;
    readonly children?: ReactNode;
}

const ACCEPTED_DECIMAL_SEPARATORS = ['.', ','];
const amountInputStyle = { textAlign: 'right' as const, fontSize: 17, fontWeight: '600' as const, fontVariant: ['tabular-nums' as const] };

export const SplitEntryRow = (props: Props) => {
    const { index, entry, currencySymbol, autoFocus, amountRef, onAmountChange, onCategoryPress, children } = props;
    const { fontScale } = useWindowDimensions();
    const formatDigits = useFormatDigits(DEFAULT_DECIMAL_PLACES);
    const [isAmountFocused, setIsAmountFocused] = useState(false);
    const categoryLayoutClassName = fontScale >= TRANSACTION_LARGE_TEXT_SCALE ? 'w-full' : 'flex-1';

    const handleAmountFocus = () => void setIsAmountFocused(true);
    const handleAmountBlur = () => void setIsAmountFocused(false);

    const { t } = useLingui();
    const hasCategorySelected = isPositiveNumber(entry.categoryId);
    const { category } = useGetCategoryByIdQuery(entry.categoryId ?? 0);

    const categoryIcon = hasCategorySelected && isDefined(category) ? category.icon : UserIconNameEnum.Circle;
    const categoryTitle = isDefined(category) ? category.title : t`Select category`;
    const titleClassName = hasCategorySelected ? 'text-primary' : 'text-warning-strong';
    const iconVariant = hasCategorySelected ? 'ghost' : 'warning';

    return (
        <Animated.View entering={MOTION_FADE_IN} exiting={MOTION_FADE_OUT} layout={MOTION_LAYOUT}>
            <View className="flex-row flex-wrap items-center gap-x-md gap-y-md px-xl py-xl">
                <HapticPressable
                    onPress={onCategoryPress}
                    accessibilityRole="button"
                    accessibilityLabel={categoryTitle}
                    className={cn('flex-row items-center gap-x-md min-h-[44px] min-w-[88px]', categoryLayoutClassName)}
                    testID={SplitEntryRowSelector.Category(index)}
                >
                    <CircleIcon
                        icon={categoryIcon}
                        size={28}
                        iconSize={16}
                        border={false}
                        variant={iconVariant}
                        iconClassName={titleClassName}
                    />
                    <Text
                        className={cn('text-[17px] leading-[22px] font-medium flex-1 shrink', titleClassName)}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                        {categoryTitle}
                    </Text>
                </HapticPressable>

                <View
                    data-focused={isAmountFocused}
                    className="ml-auto min-h-[44px] min-w-[104px] max-w-full shrink flex-row items-center justify-end rounded-full px-[8px] data-[focused=true]:bg-surface-fill"
                >
                    <Text className="text-primary text-[17px] font-semibold tabular-nums">{currencySymbol}</Text>
                    <AmountInput
                        ref={amountRef}
                        value={entry.amount}
                        keyboardType="decimal-pad"
                        acceptedDecimalSeparators={ACCEPTED_DECIMAL_SEPARATORS}
                        onChangeValue={onAmountChange}
                        inputClassName="text-primary border-0 h-auto min-h-[44px] shrink-0 px-0"
                        placeholderTextColorClassName="accent-secondary-foreground"
                        onFocus={handleAmountFocus}
                        onBlur={handleAmountBlur}
                        hitSlop={22}
                        borderless
                        autoFocus={autoFocus}
                        selectTextOnFocus
                        style={amountInputStyle}
                        placeholder={formatDigits(0)}
                        minimumDecimalPlaces={DEFAULT_DECIMAL_PLACES}
                        testID={SplitEntryRowSelector.Amount(index)}
                    />
                </View>

                {children}
            </View>
        </Animated.View>
    );
};
