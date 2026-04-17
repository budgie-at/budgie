import { DatePeriodEnum, DateRangeInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../@e2e/selectors/transaction-filters.selector';
import { DateFilterItem } from '../@generic/component/date-filter/date-filter-item';
import { RangeDatePicker } from '../@generic/component/date-picker/range-date-picker';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { FilterSheetApply } from '../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetDrawer } from '../@generic/component/filter-sheet/filter-sheet-drawer/filter-sheet-drawer';
import { useDateFilterModal } from '../@generic/context/date-filter-modal.context';
import { getDateFilterByPeriod } from '../@generic/utils/date/get-date-filter-by-period.util';
import { getPeriodByDateRange } from '../@generic/utils/date/get-period-by-date-range.util';

export default function DateFilterModal() {
    const { t } = useLingui();
    const [, resolveDateFilter, currentParams] = useDateFilterModal();

    const [localValue, setLocalValue] = useState<DateRangeInterface | null>(() => currentParams?.value ?? null);

    const selectedPeriod = getPeriodByDateRange(localValue);
    const hasSelected = isDefined(localValue);

    const handlePeriodSelect = (period: DatePeriodEnum) => void setLocalValue(getDateFilterByPeriod(period));
    const handleApply = () => {
        resolveDateFilter({ value: localValue });
    };

    const applyLabel = hasSelected ? t`Show selected range` : t`Show all dates`;

    return (
        <FilterSheet>
            <ScrollView
                className="flex-1"
                contentContainerClassName="pb-xl pt-4xl"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <ScrollView contentContainerClassName="gap-x-sm px-xl" showsHorizontalScrollIndicator={false} horizontal>
                    {Object.values(DatePeriodEnum).map(period => (
                        <DateFilterItem
                            key={period}
                            period={period}
                            onSelect={handlePeriodSelect}
                            isSelected={period === selectedPeriod}
                            testID={TransactionFiltersSelectors.DatePeriod(period)}
                        />
                    ))}
                </ScrollView>

                <View className="my-lg h-px bg-secondary-corner" />

                <View className="px-md">
                    <RangeDatePicker range={localValue} onChange={setLocalValue} />
                </View>
            </ScrollView>

            <FilterSheetDrawer>
                <FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelectors.DateApplyButton} />
            </FilterSheetDrawer>
        </FilterSheet>
    );
}
