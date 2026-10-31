import { TransactionTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionListRowPositionEnum } from '../../enum/transaction-list-row-position.enum';
import { TransactionRowLayout } from '../transaction-row-layout/transaction-row-layout';
import { TransactionRowSurface } from '../transaction-row-surface/transaction-row-surface';

import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';

interface Props {
    readonly item: TransactionPickerItemInterface;
    readonly position?: TransactionListRowPositionEnum;
    readonly isSelected?: boolean;
    readonly onPress?: (item: TransactionPickerItemInterface) => void;
    readonly testID?: string;
}

export const TransactionPickerRow = ({ item, position, isSelected = false, onPress, testID }: Props) => {
    const { formatMonthAndDay } = useFormatDate();
    const protectAmount = useProtectedAmountLabel();

    const isIncome = item.type === TransactionTypeEnum.INCOME;
    const signedAmount = `${isIncome ? '+' : ''}${protectAmount(convertFromMicroUnits(item.amount), item.currencySymbol)}`;
    const description = isNotEmptyString(item.categoryTitle)
        ? `${formatMonthAndDay(item.operatedAt)} · ${item.accountTitle} · ${item.categoryTitle}`
        : `${formatMonthAndDay(item.operatedAt)} · ${item.accountTitle}`;
    const icon = item.categoryIcon ?? (isIncome ? UserIconNameEnum.BanknoteArrowDown : UserIconNameEnum.BanknoteArrowUp);
    const iconVariant = isIncome ? 'positive' : 'secondary';
    const amountClassName = isIncome
        ? 'text-[15px] font-semibold tabular-nums text-positive-foreground'
        : 'text-[15px] font-semibold tabular-nums text-primary';
    const content = (
        <TransactionRowLayout
            icon={<CircleIcon size={36} iconSize={18} radius={18} border={false} icon={icon} variant={iconVariant} />}
            amount={
                <View className="shrink-0 items-end gap-y-xxs">
                    <Text className={amountClassName}>{signedAmount}</Text>
                    {isSelected ? <Icon icon={UserIconNameEnum.Check} size={16} className="text-positive-foreground" /> : null}
                </View>
            }
        >
            <Text className="text-[15px] font-semibold text-primary" numberOfLines={1}>
                {isNotEmptyString(item.title) ? item.title : t`No title`}
            </Text>
            <Text className="text-[13px] text-secondary-foreground" numberOfLines={1}>
                {description}
            </Text>
        </TransactionRowLayout>
    );

    if (!isDefined(onPress)) {
        return (
            <TransactionRowSurface position={position}>
                <View accessible className="px-3xl py-xl" testID={testID}>
                    {content}
                </View>
            </TransactionRowSurface>
        );
    }

    const handlePress = () => void onPress(item);
    const accessibilityState = { selected: isSelected };

    return (
        <TransactionRowSurface position={position}>
            <HapticPressable
                className="px-3xl py-xl active:scale-100 active:opacity-70"
                onPress={handlePress}
                testID={testID}
                accessibilityRole="radio"
                accessibilityState={accessibilityState}
            >
                {content}
            </HapticPressable>
        </TransactionRowSurface>
    );
};
