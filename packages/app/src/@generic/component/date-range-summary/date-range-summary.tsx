import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { SheetTitleRow } from '../sheet-title-row/sheet-title-row';

import type { DateRangeInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly range: DateRangeInterface | null;
}

export const DateRangeSummary = ({ title, range }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();
    const from = range?.from;
    const to = range?.to;
    const isComplete = isDefined(from) && isDefined(to);
    const dayCount = isComplete ? differenceInCalendarDays(to, from) + 1 : 0;
    const daysLabel = t({ message: plural(dayCount, { one: '# day', other: '# days' }) });
    const rangeLabel = isComplete
        ? `${formatMonthAndDay(from)} – ${formatDayAndMonthAndYear(to)} · ${daysLabel}`
        : t`Pick a start and an end date`;

    return (
        <View className="gap-y-xxs px-md">
            <SheetTitleRow title={title} />
            <Text className="text-secondary-foreground text-center text-[13px] tabular-nums">{rangeLabel}</Text>
        </View>
    );
};
