import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';

import type { TransactionPickerRowPropsInterface } from '../../interface/transaction-picker-row-props.interface';

export const TransactionPickerRow = ({ item, isSelected = false, onPress, testID }: TransactionPickerRowPropsInterface) => {
    const { decimalPlaces } = useSettingsContext();
    const { formatMonthAndDay } = useFormatDate();
    const formatDigits = useFormatDigits(decimalPlaces);

    const isIncome = item.type === TransactionTypeEnum.INCOME;
    const signedAmount = isIncome
        ? `+${formatDigits(convertFromMicroUnits(item.amount), item.currencySymbol)}`
        : `-${formatDigits(convertFromMicroUnits(item.amount), item.currencySymbol)}`;
    const description = isNotEmptyString(item.categoryTitle)
        ? `${formatMonthAndDay(item.operatedAt)} · ${item.accountTitle} · ${item.categoryTitle}`
        : `${formatMonthAndDay(item.operatedAt)} · ${item.accountTitle}`;
    const icon = item.categoryIcon ?? (isIncome ? UserIconNameEnum.BanknoteArrowDown : UserIconNameEnum.BanknoteArrowUp);
    const amountClassName = isIncome
        ? 'text-md font-semibold text-positive-foreground'
        : 'text-md font-semibold text-destructive-foreground';
    const rowClassName = isSelected
        ? 'flex-row items-center gap-x-md rounded-3xl border px-lg py-md active:opacity-80 border-positive-corner bg-positive-background'
        : 'flex-row items-center gap-x-md rounded-3xl border px-lg py-md active:opacity-80 border-secondary-corner bg-secondary-background';
    const content = (
        <>
            <CircleIcon size={40} iconSize={20} icon={icon} variant={TRANSACTION_COLOR[item.type]} />

            <View className="flex-1 gap-y-1">
                <View className="flex-row items-center gap-x-sm">
                    <Text className="flex-1 text-md font-semibold text-primary" numberOfLines={1}>
                        {isNotEmptyString(item.title) ? item.title : t`No title`}
                    </Text>
                </View>
                <Text className="text-sm text-secondary-foreground" numberOfLines={1}>
                    {description}
                </Text>
            </View>

            <View className="items-end gap-y-xs">
                <Text className={amountClassName}>{signedAmount}</Text>
                {isSelected ? <Icon icon={UserIconNameEnum.Check} size={16} className="text-positive-foreground" /> : null}
            </View>
        </>
    );

    if (!isDefined(onPress)) {
        return (
            <View className={rowClassName} testID={testID}>
                {content}
            </View>
        );
    }

    const handlePress = () => void onPress(item);

    return (
        <HapticPressable className={rowClassName} onPress={handlePress} testID={testID}>
            {content}
        </HapticPressable>
    );
};
