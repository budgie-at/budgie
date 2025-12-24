import { DatePeriodEnum, DateRangeInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionBaseFilter } from '../../../transaction/components/transaction-base-filter/transaction-base-filter';
import { TransactionFilterChip } from '../../../transaction/components/transaction-filter-chip/transaction-filter-chip';
import { DATE_PERIOD } from '../../constant/date-period.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { getDateFilterByPeriod } from '../../utils/date/get-date-filter-by-period.util';
import { getPeriodByDateRange } from '../../utils/date/get-period-by-date-range.util';
import { RangeDatePicker } from '../date-picker/range-date-picker';

import { DateFilterItem } from './date-filter-item';

interface Props {
    readonly value: DateRangeInterface | null;
    readonly onChange: (value: DateRangeInterface | null) => void;
}

export const DateFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [localValue, setLocalValue] = useState<DateRangeInterface | null>(() => value);
    const selectedPeriod = getPeriodByDateRange(localValue);
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();
    const { t, i18n } = useLingui();

    const handleOpen = () => {
        setLocalValue(value);
        void ref.current?.open();
    };
    const handlePeriodSelect = (period: DatePeriodEnum) => void setLocalValue(getDateFilterByPeriod(period));

    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        onChange(localValue);
        ref.current?.close();
    };

    const getLabel = () => {
        const period = getPeriodByDateRange(value);

        if (!isDefined(value)) {
            return t`Date`;
        }

        if (isDefined(period)) {
            return i18n.t(DATE_PERIOD[period]);
        }

        if (isDefined(value.from) && isDefined(value.to)) {
            return value.from.getFullYear() === value.to.getFullYear()
                ? `${formatMonthAndDay(value.from)} – ${formatMonthAndDay(value.to)}`
                : `${formatDayAndMonthAndYear(value.from)} – ${formatDayAndMonthAndYear(value.to)}`;
        }

        if (isDefined(value.from)) {
            return formatMonthAndDay(value.from);
        }

        if (isDefined(value.to)) {
            return formatMonthAndDay(value.to);
        }

        return t`Date`;
    };

    const hasDateFilterSelected = isDefined(value?.from) || isDefined(value?.to);

    const label = getLabel();

    return (
        <>
            <TransactionFilterChip isActive={hasDateFilterSelected} icon="Calendar" label={label} onPress={handleOpen} />

            <TransactionBaseFilter
                title={t`Date Range`}
                onClear={handleClear}
                icon="Calendar"
                hasSelected={isDefined(localValue)}
                onApply={handleApply}
                enableDynamicSizing
                useBottomSheetView
                ref={ref}
            >
                <View className="pt-[40px] gap-y-7xl">
                    <ScrollView contentContainerClassName="gap-x-md px-7xl" showsHorizontalScrollIndicator={false} horizontal>
                        {Object.values(DatePeriodEnum).map(period => (
                            <DateFilterItem
                                key={period}
                                period={period}
                                onSelect={handlePeriodSelect}
                                isSelected={period === selectedPeriod}
                            />
                        ))}
                    </ScrollView>

                    <RangeDatePicker range={localValue} onChange={setLocalValue} />
                </View>
            </TransactionBaseFilter>
        </>
    );
};
