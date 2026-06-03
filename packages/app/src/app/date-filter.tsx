import { DatePeriodEnum, DateRangeInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { DateFilterItem } from '../@generic/component/date-filter/date-filter-item';
import { RangeDatePicker } from '../@generic/component/date-picker/range-date-picker';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { FilterSheetApply } from '../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetDrawer } from '../@generic/component/filter-sheet/filter-sheet-drawer/filter-sheet-drawer';
import { useDateFilterModal } from '../@generic/context/date-filter-modal.context';
import { getDateFilterByPeriod } from '../@generic/utils/date/get-date-filter-by-period.util';
import { getPeriodByDateRange } from '../@generic/utils/date/get-period-by-date-range.util';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';

const DATE_FILTER_PERIODS: readonly DatePeriodEnum[] = [
    DatePeriodEnum.THIS_MONTH,
    DatePeriodEnum.LAST_MONTH,
    DatePeriodEnum.ALL_TIME,
    DatePeriodEnum.TODAY,
    DatePeriodEnum.THIS_WEEK,
    DatePeriodEnum.LAST_WEEK,
    DatePeriodEnum.THIS_YEAR
];

const getCalendarVisibleDate = (range: DateRangeInterface | null): Date | null => {
    if (!isDefined(range)) {
        return null;
    }

    const { from, to } = range;
    const now = new Date();

    if (isDefined(from) && isDefined(to)) {
        const nowTime = now.getTime();
        const fromTime = from.getTime();
        const toTime = to.getTime();
        const isNowInRange = fromTime <= nowTime && nowTime <= toTime;

        if (isNowInRange) {
            return now;
        }

        return nowTime - fromTime < toTime - nowTime ? from : to;
    }

    if (isDefined(to)) {
        return to;
    }

    return from;
};

export default function DateFilterModal() {
    const { t } = useLingui();
    const [, resolveDateFilter, currentParams] = useDateFilterModal();

    const [localValue, setLocalValue] = useState<DateRangeInterface | null>(() => currentParams?.value ?? null);
    const [visibleDate, setVisibleDate] = useState<Date | null>(() => getCalendarVisibleDate(currentParams?.value ?? null));
    const [calendarResetKey, setCalendarResetKey] = useState(0);

    const selectedPeriod = getPeriodByDateRange(localValue);
    const hasSelected = isDefined(localValue);

    const handlePeriodSelect = (period: DatePeriodEnum) => {
        const nextValue = getDateFilterByPeriod(period);

        setLocalValue(nextValue);
        setVisibleDate(getCalendarVisibleDate(nextValue));
        setCalendarResetKey(current => current + 1);
    };

    const handleRangeChange = (range: DateRangeInterface) => {
        setLocalValue(range);
        setVisibleDate(getCalendarVisibleDate(range));
    };

    const handleApply = () => {
        resolveDateFilter({ value: localValue });
    };

    const applyLabel = hasSelected ? t`Show selected range` : t`Show all dates`;

    return (
        <FilterSheet>
            <ScrollView
                className="flex-1"
                contentContainerClassName="pb-sm pt-sm px-md"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <RangeDatePicker
                    range={localValue}
                    calendarResetKey={calendarResetKey}
                    visibleDate={visibleDate}
                    onChange={handleRangeChange}
                />
            </ScrollView>

            <FilterSheetDrawer>
                <ScrollView contentContainerClassName="gap-x-sm" showsHorizontalScrollIndicator={false} horizontal>
                    {DATE_FILTER_PERIODS.map(period => (
                        <DateFilterItem
                            key={period}
                            period={period}
                            onSelect={handlePeriodSelect}
                            isSelected={period === selectedPeriod}
                            testID={TransactionFiltersSelector.DatePeriod(period)}
                        />
                    ))}
                </ScrollView>
                <FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelector.DateApplyButton} />
            </FilterSheetDrawer>
        </FilterSheet>
    );
}
