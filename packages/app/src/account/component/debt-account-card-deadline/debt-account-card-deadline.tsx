import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { differenceInCalendarDays } from 'date-fns';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useDebtDeadlineDate } from '../../hook/use-debt-deadline-date.hook';

interface Props {
    readonly deadline: Date;
}

export const DebtAccountCardDeadline = ({ deadline }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const now = useDebtDeadlineDate();
    const days = differenceInCalendarDays(deadline, now);
    const overdueDays = Math.abs(days);
    const isOverdue = days < 0;
    const isSoon = !isOverdue && days <= 30;
    const textClassName = isOverdue ? 'text-destructive-foreground' : 'text-warning-foreground';
    const dotClassName = isOverdue ? 'bg-destructive-foreground' : 'bg-warning-foreground';
    const relativeDate = days === 0 ? t`Today` : t({ message: plural(days, { one: 'In # day', other: 'In # days' }) });
    const dateLabel = isOverdue
        ? t({ message: plural(overdueDays, { one: 'Overdue # day', other: 'Overdue # days' }) })
        : `${relativeDate} · ${formatDayAndMonthAndYear(deadline)}`;

    if (!isOverdue && !isSoon) {
        const date = formatDayAndMonthAndYear(deadline);

        return <Text className="text-xs text-secondary-foreground" numberOfLines={1}>{t`Due ${date}`}</Text>;
    }

    return (
        <View className="flex-row items-center gap-x-xs">
            <View className={cn('h-[6px] w-[6px] rounded-full', dotClassName)} />
            <Text className={cn('shrink text-xs tabular-nums', textClassName)} numberOfLines={1}>
                {dateLabel}
            </Text>
        </View>
    );
};
