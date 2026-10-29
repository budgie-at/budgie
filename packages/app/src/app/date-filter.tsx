import { DatePeriodEnum, DateRangeInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useReducer } from 'react';
import { ScrollView } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { DateFilterItem } from '../@generic/component/date-filter/date-filter-item';
import { RangeDatePicker } from '../@generic/component/date-picker/range-date-picker';
import { FilterSheetApply } from '../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetDrawer } from '../@generic/component/filter-sheet/filter-sheet-drawer/filter-sheet-drawer';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { useDateFilterModal, useDateFilterModalParams } from '../@generic/context/date-filter-modal.context';
import { DateFilterActionTypeEnum } from '../@generic/enum/date-filter-action-type.enum';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { dateFilterReducer } from '../@generic/utils/date-filter-reducer.util';
import { getCalendarVisibleDate } from '../@generic/utils/date/get-calendar-visible-date.util';
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

export default function DateFilterModal() {
    const { t } = useLingui();
    const [, resolveDateFilter, dismissDateFilter] = useDateFilterModal();
    useModalDismiss(dismissDateFilter);
    const currentParams = useDateFilterModalParams();

    const [{ value: localValue, visibleDate, calendarResetKey }, dispatch] = useReducer(
        dateFilterReducer,
        currentParams?.value ?? null,
        initialValue => ({ value: initialValue, visibleDate: getCalendarVisibleDate(initialValue), calendarResetKey: 0 })
    );

    const selectedPeriod = getPeriodByDateRange(localValue);
    const hasSelected = isDefined(localValue);

    const handlePeriodSelect = (period: DatePeriodEnum) => {
        dispatch({ type: DateFilterActionTypeEnum.PERIOD_SELECTED, range: getDateFilterByPeriod(period) });
    };

    const handleRangeChange = (range: DateRangeInterface) => {
        dispatch({ type: DateFilterActionTypeEnum.RANGE_CHANGED, range });
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
