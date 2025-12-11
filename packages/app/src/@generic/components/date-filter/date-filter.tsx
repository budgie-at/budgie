import { DateFilterInterface, DatePeriodEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { DATE_PERIOD } from '../../constant/date-period.constant';
import { ICONS } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { getDateFilterByPeriod } from '../../utils/date/get-date-filter-by-period.util';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../bottom-sheet-view/bottom-sheet-view';
import { CircleIcon } from '../circle-icon/circle-icon';
import { DatePicker } from '../date-picker/date-picker';
import { FilterChip } from '../filter-chip/filter-chip';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

export const DateFilter = () => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [dateFilter, setDateFilter] = useState<DateFilterInterface | null>(null);
    const { t, i18n } = useLingui();

    const handleOpen = () => ref.current?.open();
    const handlePeriodSelect = (period: DatePeriodEnum) => void setDateFilter(getDateFilterByPeriod(period));

    return (
        <>
            <FilterChip icon="Calendar" label={t`Date`} onPress={handleOpen} />

            <BottomSheet enableDynamicSizing ref={ref}>
                <BottomSheetView>
                    <View className="flex-row items-center gap-x-xl px-7xl py-3xl border-b border-b-secondary-corner">
                        <CircleIcon icon={ICONS.Calendar} variant="ghost" size="xl" />

                        <Text className="text-primary font-semibold text-3xl mr-auto">
                            <Trans>Date Range</Trans>
                        </Text>

                        <HapticPressable>
                            <Text className="text-primary text-sm fond-medium">
                                <Trans>Clear</Trans>
                            </Text>
                        </HapticPressable>
                    </View>

                    <View className="pt-[40px] gap-y-7xl">
                        <ScrollView contentContainerClassName="gap-x-md px-7xl" showsHorizontalScrollIndicator={false} horizontal>
                            {Object.values(DatePeriodEnum).map(period => (
                                <HapticPressable
                                    className="rounded-2xl border border-secondary-corner px-xl py-sm"
                                    key={period}
                                    onPress={() => void handlePeriodSelect(period)}
                                >
                                    <Text className="text-secondary-foreground">{i18n.t(DATE_PERIOD[period])}</Text>
                                </HapticPressable>
                            ))}
                        </ScrollView>

                        <DatePicker
                            mode="range"
                            startDate={dateFilter?.from ?? null}
                            endDate={dateFilter?.to ?? null}
                            onChange={console.log}
                        />
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </>
    );
};
