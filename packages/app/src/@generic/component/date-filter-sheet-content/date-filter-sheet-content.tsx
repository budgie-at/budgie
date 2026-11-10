import { DatePeriodEnum, DateRangeInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useReducer } from 'react';
import { ScrollView } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../constant/morphing-sheet-height-ratio.constant';
import { DateFilterActionTypeEnum } from '../../enum/date-filter-action-type.enum';
import { useMorphingSheetCommit } from '../../hook/use-morphing-sheet-commit.hook';
import { dateFilterReducer } from '../../utils/date-filter-reducer.util';
import { getCalendarVisibleDate } from '../../utils/date/get-calendar-visible-date.util';
import { getDateFilterByPeriod } from '../../utils/date/get-date-filter-by-period.util';
import { getPeriodByDateRange } from '../../utils/date/get-period-by-date-range.util';
import { DateFilterItem } from '../date-filter/date-filter-item';
import { RangeDatePicker } from '../date-picker/range-date-picker';
import { FilterSheetApply } from '../filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetFooter } from '../filter-sheet/filter-sheet-footer/filter-sheet-footer';
import { FilterSheetHeader } from '../filter-sheet/filter-sheet-header/filter-sheet-header';
import { ScrollableSheetCard } from '../scrollable-sheet-card/scrollable-sheet-card';

import type { ModalResult } from '../../type/modal-result.type';

const DATE_FILTER_PERIODS: readonly DatePeriodEnum[] = [
    DatePeriodEnum.THIS_MONTH,
    DatePeriodEnum.LAST_MONTH,
    DatePeriodEnum.ALL_TIME,
    DatePeriodEnum.TODAY,
    DatePeriodEnum.THIS_WEEK,
    DatePeriodEnum.LAST_WEEK,
    DatePeriodEnum.THIS_YEAR
];

interface Props {
    readonly range: DateRangeInterface | null;
    readonly onCommit: (result: ModalResult<'/date-filter'>) => void;
    readonly datePeriodTestID: (period: DatePeriodEnum) => string;
    readonly applyTestID: string;
}

export const DateFilterSheetContent = ({ range, onCommit, datePeriodTestID, applyTestID }: Props) => {
    const { t } = useLingui();
    const commit = useMorphingSheetCommit(onCommit);

    const [{ value: localValue, visibleDate, calendarResetKey }, dispatch] = useReducer(dateFilterReducer, range, initialValue => ({
        value: initialValue,
        visibleDate: getCalendarVisibleDate(initialValue),
        calendarResetKey: 0
    }));

    const selectedPeriod = getPeriodByDateRange(localValue);
    const hasSelected = isDefined(localValue);

    const handlePeriodSelect = (period: DatePeriodEnum) => {
        dispatch({ type: DateFilterActionTypeEnum.PERIOD_SELECTED, range: getDateFilterByPeriod(period) });
    };

    const handleRangeChange = (nextRange: DateRangeInterface) => {
        dispatch({ type: DateFilterActionTypeEnum.RANGE_CHANGED, range: nextRange });
    };

    const handleApply = () => void commit({ value: localValue });

    const applyLabel = hasSelected ? t`Show selected range` : t`Show all dates`;

    return (
        <ScrollableSheetCard
            header={<FilterSheetHeader title={t`Date`} />}
            ratio={MORPHING_SHEET_SELECTOR_HEIGHT_RATIO}
            contentClassName="px-md pt-sm pb-[16px]"
            footer={
                <FilterSheetFooter>
                    <ScrollView contentContainerClassName="gap-x-sm" showsHorizontalScrollIndicator={false} horizontal>
                        {DATE_FILTER_PERIODS.map(period => (
                            <DateFilterItem
                                key={period}
                                period={period}
                                onSelect={handlePeriodSelect}
                                isSelected={period === selectedPeriod}
                                testID={datePeriodTestID(period)}
                            />
                        ))}
                    </ScrollView>
                    <FilterSheetApply onApply={handleApply} label={applyLabel} testID={applyTestID} />
                </FilterSheetFooter>
            }
        >
            <RangeDatePicker
                range={localValue}
                calendarResetKey={calendarResetKey}
                visibleDate={visibleDate}
                onChange={handleRangeChange}
            />
        </ScrollableSheetCard>
    );
};
