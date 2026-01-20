import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { ScrollView, Text } from 'react-native';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';

const MAX_PERIOD_START_DAY = 28;
const BOTTOM_SHEET_SNAP_POINTS = ['50%'];

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedDay: number;
    readonly onSelect: (day: number) => void;
}

export const BudgetPeriodStartDaySelectorBottomSheet = ({ ref, selectedDay, onSelect }: Props) => {
    const { t } = useLingui();

    const days = Array.from({ length: MAX_PERIOD_START_DAY }, (_, index) => index + 1);

    const handleSelectDay = (day: number) => {
        onSelect(day);
        ref.current?.close();
    };

    return (
        <BottomSheet snapPoints={BOTTOM_SHEET_SNAP_POINTS} ref={ref}>
            <BottomSheetHeader size="md" title={t`Period Start Day`} />
            <ScrollView
                className="flex-1 px-5xl pb-5xl"
                contentContainerClassName="flex-row flex-wrap gap-md"
                showsVerticalScrollIndicator={false}
            >
                {days.map(day => {
                    const isSelected = day === selectedDay;
                    const buttonClassName = isSelected
                        ? 'w-14 h-14 rounded-xl bg-primary items-center justify-center'
                        : 'w-14 h-14 rounded-xl bg-secondary-background items-center justify-center';
                    const textClassName = isSelected ? 'text-lg font-medium text-primary-reverse' : 'text-lg text-primary';
                    const handlePress = () => void handleSelectDay(day);

                    return (
                        <HapticPressable key={day} className={buttonClassName} onPress={handlePress}>
                            <Text className={textClassName}>{day}</Text>
                        </HapticPressable>
                    );
                })}
            </ScrollView>
        </BottomSheet>
    );
};
