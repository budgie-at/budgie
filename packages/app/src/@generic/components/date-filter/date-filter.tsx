import { DateFilterInterface, DatePeriodEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { DATE_PERIOD } from '../../constant/date-period.constant';
import { ICONS } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { getDateFilterByPeriod } from '../../utils/date/get-date-filter-by-period.util';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../bottom-sheet-view/bottom-sheet-view';
import { Button } from '../button/button';
import { CircleIcon } from '../circle-icon/circle-icon';
import { DatePicker } from '../date-picker/date-picker';
import { FilterChip } from '../filter-chip/filter-chip';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { getPeriodByDateRange } from '../../utils/date/get-period-by-date-range.util';

interface Props {
    readonly value: DateFilterInterface | null;
    readonly onChange: (value: DateFilterInterface | null) => void;
}

const chipVariants = cva('rounded-2xl border border-secondary-corner px-4xl py-md', {
    variants: {
        isSelected: {
            true: 'bg-primary',
            false: ''
        }
    }
});

const chipTextVariants = cva('font-semibold', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    }
});

export const DateFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [localValue, setLocalValue] = useState<DateFilterInterface | null>(() => value);
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();
    const selectedPeriod = getPeriodByDateRange(value);
    const { t, i18n } = useLingui();

    const handleOpen = () => ref.current?.open();
    const handlePeriodSelect = (period: DatePeriodEnum) => {
        setLocalValue(getDateFilterByPeriod(period));
    };

    const handleDateChange = ({ endDate, startDate }: { endDate?: Date; startDate?: Date }) => {
        setLocalValue({
            from: isDefined(startDate) ? new Date(startDate) : null,
            to: isDefined(endDate) ? new Date(endDate) : null
        });
    };

    const handleClear = () => {
        setLocalValue(null);
        onChange(null);
        ref.current?.close();
    };

    const handleApply = () => {
        onChange(localValue);
        ref.current?.close();
    };

    const getLabel = () => {
        if (isDefined(selectedPeriod)) {
            return i18n.t(DATE_PERIOD[selectedPeriod]);
        }

        if (!isDefined(value)) {
            return t`Date`;
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
            <FilterChip isActive={hasDateFilterSelected} icon="Calendar" label={label} onPress={handleOpen} />

            <BottomSheet enableDynamicSizing ref={ref}>
                <BottomSheetView>
                    <View className="flex-row items-center gap-x-xl px-7xl py-3xl border-b border-b-secondary-corner">
                        <CircleIcon icon={ICONS.Calendar} variant="ghost" size="xl" />

                        <Text className="text-primary font-semibold text-3xl mr-auto">
                            <Trans>Date Range</Trans>
                        </Text>

                        <HapticPressable onPress={handleClear}>
                            <Text className="text-primary text-sm font-medium">
                                <Trans>Clear</Trans>
                            </Text>
                        </HapticPressable>
                    </View>

                    <View className="pt-[40px] gap-y-7xl">
                        <ScrollView contentContainerClassName="gap-x-md px-7xl" showsHorizontalScrollIndicator={false} horizontal>
                            {Object.values(DatePeriodEnum).map(period => (
                                <HapticPressable
                                    className={chipVariants({ isSelected: period === selectedPeriod })}
                                    key={period}
                                    onPress={() => void handlePeriodSelect(period)}
                                >
                                    <Text className={chipTextVariants({ isSelected: period === selectedPeriod })}>
                                        {i18n.t(DATE_PERIOD[period])}
                                    </Text>
                                </HapticPressable>
                            ))}
                        </ScrollView>

                        <DatePicker
                            mode="range"
                            startDate={localValue?.from ?? null}
                            endDate={localValue?.to ?? null}
                            onChange={handleDateChange}
                        />
                    </View>

                    <View className="px-7xl pt-4xl border-t border-t-secondary-corner">
                        <Button onPress={handleApply} variant="ghost" content={t`Apply Filter`} />
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </>
    );
};
