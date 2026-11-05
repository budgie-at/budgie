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
    const mainClassName = largeText ? 'gap-y-sm' : 'flex-row items-start gap-x-md';
    const titleClassName = largeText ? 'text-[16px] font-semibold text-primary' : 'flex-1 text-[16px] font-semibold text-primary';
    const amountClassName =
        item.type === TransactionTypeEnum.INCOME
            ? 'text-[17px] font-semibold tabular-nums text-positive-strong'
            : 'text-[17px] font-semibold tabular-nums text-primary';
    const amountRowClassName = largeText ? 'flex-row items-center justify-between gap-x-md' : 'flex-row items-center gap-x-sm';
    const icon = item.categoryIcon ?? UserIconNameEnum.ReceiptText;

    return (
        <View className="flex-row items-start gap-x-md">
            {largeText ? null : <CircleIcon icon={icon} size={32} iconSize={16} variant="secondary" border={false} />}
            <View className="flex-1 min-w-0 gap-y-sm">
                <View className={mainClassName}>
                    <Text dynamicTypeRamp="body" className={titleClassName}>
                        {title}
                    </Text>
                    <View className={amountRowClassName}>
                        <Text dynamicTypeRamp="body" className={amountClassName}>
                            {amount}
                        </Text>
                        {selection}
                    </View>
                </View>
                <View className="gap-y-xxs">
                    <Text dynamicTypeRamp="caption1" className="text-[13px] text-secondary-foreground">
                        {item.accountTitle}
                    </Text>
                    <Text dynamicTypeRamp="caption2" className="text-[12px] text-secondary-foreground">
                        {date}
                    </Text>
                    {isNotEmptyString(item.categoryTitle) ? (
                        <Text dynamicTypeRamp="caption1" className="text-[13px] text-secondary-foreground">
                            {item.categoryTitle}
                        </Text>
                    ) : null}
                </View>
            </View>
        </View>
    );
};
