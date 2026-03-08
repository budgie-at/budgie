import { DatePeriodEnum, DateRangeInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../@e2e/selectors/transaction-filters.selector';
import { Button } from '../@generic/component/button/button';
import { DateFilterItem } from '../@generic/component/date-filter/date-filter-item';
import { RangeDatePicker } from '../@generic/component/date-picker/range-date-picker';
import { Footer } from '../@generic/component/footer/footer';
import { useDateFilterModal } from '../@generic/context/date-filter-modal.context';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { getDateFilterByPeriod } from '../@generic/utils/date/get-date-filter-by-period.util';
import { getPeriodByDateRange } from '../@generic/utils/date/get-period-by-date-range.util';
import { TransactionFilterHeader } from '../transaction/components/transaction-filter-header/transaction-filter-header';

export default function DateFilterModal() {
    const { t } = useLingui();
    const [, resolveDateFilter, currentParams] = useDateFilterModal();
    const { backgroundColor } = useFormsheetListStyles();

    const [localValue, setLocalValue] = useState<DateRangeInterface | null>(() => currentParams?.value ?? null);

    const selectedPeriod = getPeriodByDateRange(localValue);
    const hasSelected = isDefined(localValue);
    const containerStyle = { flex: 1, backgroundColor };

    const handlePeriodSelect = (period: DatePeriodEnum) => void setLocalValue(getDateFilterByPeriod(period));

    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        resolveDateFilter({ value: localValue });
    };

    return (
        <View style={containerStyle}>
            <TransactionFilterHeader title={t`Date Range`} icon={UserIconNameEnum.Calendar} onClear={handleClear} showClear={hasSelected} />

            <View className="flex-1 pt-[40px] gap-y-7xl">
                <ScrollView contentContainerClassName="gap-x-md px-7xl" showsHorizontalScrollIndicator={false} horizontal>
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

                <View className="flex-1">
                    <RangeDatePicker range={localValue} onChange={setLocalValue} />
                </View>
            </View>

            <Footer>
                <Button
                    variant="ghost"
                    onPress={handleApply}
                    content={t`Apply Filter`}
                    testID={TransactionFiltersSelectors.DateApplyButton}
                />
            </Footer>
        </View>
    );
}
