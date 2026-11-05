import { TransactionTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionListRowPositionEnum } from '../../enum/transaction-list-row-position.enum';
import { TransactionPickerRowContent } from '../transaction-picker-row-content/transaction-picker-row-content';
import { TransactionRowSurface } from '../transaction-row-surface/transaction-row-surface';

import type { TransactionPickerItemInterface } from '../../interface/transaction-picker-item.interface';

interface Props {
    readonly item: TransactionPickerItemInterface;
    readonly position?: TransactionListRowPositionEnum;
    readonly isSelected?: boolean;
    readonly onPress?: (item: TransactionPickerItemInterface) => void;
    readonly testID?: string;
}

const pressableVariants = cva('px-xl py-xl active:scale-100 active:opacity-70', {
    variants: { selected: { true: 'bg-secondary-background' } }
});

export const TransactionPickerRow = ({ item, position, isSelected = false, onPress, testID }: Props) => {
    const { formatMonthAndDayWithTime } = useFormatDate();
    const protectAmount = useProtectedAmountLabel();
    const separatorInset = useIsAccessibilityTextSize() ? 16 : 60;
    const signedAmount = `${item.type === TransactionTypeEnum.INCOME ? '+' : ''}${protectAmount(convertFromMicroUnits(item.amount), item.currencySymbol)}`;
    const title = isNotEmptyString(item.title) ? item.title : t`No title`;
    const date = formatMonthAndDayWithTime(item.operatedAt);
    const accessibilityLabel = [title, date, item.accountTitle, item.categoryTitle, signedAmount].filter(isNotEmptyString).join(', ');
    const selectionIcon = isSelected ? UserIconNameEnum.CircleCheck : UserIconNameEnum.Circle;
    const selection = isDefined(onPress) ? <Icon icon={selectionIcon} size={28} className="text-primary" /> : null;
    const content = <TransactionPickerRowContent item={item} title={title} date={date} amount={signedAmount} selection={selection} />;

    if (!isDefined(onPress)) {
        return (
            <TransactionRowSurface position={position} separatorInset={separatorInset} className="bg-surface-row">
                <View accessible className="px-xl py-xl" testID={testID} accessibilityLabel={accessibilityLabel}>
                    {content}
                </View>
            </TransactionRowSurface>
        );
    }

    const handlePress = () => void onPress(item);
    const accessibilityState = { selected: isSelected };

    return (
        <TransactionRowSurface position={position} separatorInset={separatorInset} className="bg-surface-row">
            <HapticPressable
                className={pressableVariants({ selected: isSelected })}
                onPress={handlePress}
                testID={testID}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="radio"
                accessibilityState={accessibilityState}
            >
                {content}
            </HapticPressable>
        </TransactionRowSurface>
    );
};
