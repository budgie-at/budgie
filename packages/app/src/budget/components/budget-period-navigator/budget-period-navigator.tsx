import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly startDate: Date;
    readonly endDate: Date;
    readonly isCurrentPeriod: boolean;
    readonly onPrevious: () => void;
    readonly onNext: () => void;
}

export const BudgetPeriodNavigator = ({ startDate, endDate, isCurrentPeriod, onPrevious, onNext }: Props) => {
    const { formatMonthAndDay } = useFormatDate();

    const dateRangeLabel = `${formatMonthAndDay(startDate)} - ${formatMonthAndDay(endDate)}`;
    const nextIconClassName = isCurrentPeriod ? 'text-secondary-foreground opacity-40' : 'text-primary';

    return (
        <View className="flex-row items-center justify-center gap-x-lg px-7xl py-md">
            <HapticPressable onPress={onPrevious}>
                <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary" size={24} />
            </HapticPressable>
            <Text className="text-primary text-base font-medium min-w-[150px] text-center">{dateRangeLabel}</Text>
            <HapticPressable onPress={onNext} disabled={isCurrentPeriod}>
                <Icon icon={UserIconNameEnum.ChevronRight} className={nextIconClassName} size={24} />
            </HapticPressable>
        </View>
    );
};
