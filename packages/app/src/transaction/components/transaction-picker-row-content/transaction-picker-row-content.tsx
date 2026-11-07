import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly item: TransactionPickerItemInterface;
    readonly title: string;
    readonly amount: string;
    readonly date: string;
    readonly selection: ReactNode;
}

export const TransactionPickerRowContent = ({ item, title, amount, date, selection }: Props) => {
    const largeText = useIsAccessibilityTextSize();
    const amountClassName =
        item.type === TransactionTypeEnum.INCOME
            ? 'text-[17px] font-semibold tabular-nums text-positive-strong'
            : 'text-[17px] font-semibold tabular-nums text-primary';
    const icon = item.categoryIcon ?? UserIconNameEnum.ReceiptText;

    if (largeText) {
        return (
            <View className="gap-y-sm">
                <View className="flex-row items-center justify-between gap-x-md">
                    <Text maxFontSizeMultiplier={1.3} dynamicTypeRamp="body" className={amountClassName}>
                        {amount}
                    </Text>
                    {selection}
                </View>
                <Text maxFontSizeMultiplier={1.3} dynamicTypeRamp="caption1" className="text-[14px] font-medium text-secondary-foreground">
                    {date}
                </Text>
                <Text maxFontSizeMultiplier={1.3} dynamicTypeRamp="body" className="text-[16px] font-semibold text-primary">
                    {title}
                </Text>
                <Text maxFontSizeMultiplier={1.3} dynamicTypeRamp="caption1" className="text-[13px] text-secondary-foreground">
                    {item.accountTitle}
                </Text>
                {isNotEmptyString(item.categoryTitle) ? (
                    <Text maxFontSizeMultiplier={1.3} dynamicTypeRamp="caption1" className="text-[13px] text-secondary-foreground">
                        {item.categoryTitle}
                    </Text>
                ) : null}
            </View>
        );
    }

    return (
        <View className="flex-row items-start gap-x-md">
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <CircleIcon icon={icon} size={32} iconSize={16} variant="secondary" border={false} />
            </View>
            <View className="flex-1 min-w-0 gap-y-sm">
                <View className="flex-row items-start gap-x-md">
                    <Text maxFontSizeMultiplier={1.3} dynamicTypeRamp="body" className="flex-1 text-[16px] font-semibold text-primary">
                        {title}
                    </Text>
                    <View className="flex-row items-center gap-x-sm">
                        <Text maxFontSizeMultiplier={1.3} dynamicTypeRamp="body" className={amountClassName}>
                            {amount}
                        </Text>
                        {selection}
                    </View>
                </View>
                <View className="gap-y-xs">
                    <Text maxFontSizeMultiplier={1.3} dynamicTypeRamp="caption1" className="text-[13px] text-secondary-foreground">
                        {item.accountTitle}
                    </Text>
                    <Text
                        maxFontSizeMultiplier={1.3}
                        dynamicTypeRamp="caption1"
                        className="text-[14px] font-medium text-secondary-foreground"
                    >
                        {date}
                    </Text>
                    {isNotEmptyString(item.categoryTitle) ? (
                        <Text maxFontSizeMultiplier={1.3} dynamicTypeRamp="caption1" className="text-[13px] text-secondary-foreground">
                            {item.categoryTitle}
                        </Text>
                    ) : null}
                </View>
            </View>
        </View>
    );
};
