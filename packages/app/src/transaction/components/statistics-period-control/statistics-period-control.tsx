import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { isFuture } from 'date-fns';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { useDateFilterModal } from '../../../@generic/context/date-filter-modal.context';
import { normalizeToWholeDays } from '../../../@generic/utils/date/normalize-to-whole-days.util';
import { shiftDateRange } from '../../../@generic/utils/date/shift-date-range.util';
import { useFormatDateRange } from '../../../i18n/hook/use-format-date-range.hook';
import { StatisticsPeriodStepButton } from '../statistics-period-step-button/statistics-period-step-button';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

import type { DateRangeInterface } from '@budgie/contracts';

interface Props {
    readonly value: DateRangeInterface | null;
    readonly onChange: (value: DateRangeInterface | null) => void;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const StatisticsPeriodControl = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const [openDateFilter] = useDateFilterModal();
    const formatDateRange = useFormatDateRange();

    const handleOpen = () => {
        openDateFilter({ value }, selectedFilter => {
            if (isDefined(selectedFilter)) {
                onChange(normalizeToWholeDays(selectedFilter.value));
            }
        });
    };

    const previousRange = shiftDateRange(value, -1);
    const shiftedNextRange = shiftDateRange(value, 1);
    const nextRange = isDefined(shiftedNextRange?.from) && isFuture(shiftedNextRange.from) ? null : shiftedNextRange;
    const label = formatDateRange(value);
    const hasDateSelected = isDefined(value?.from) || isDefined(value?.to);
    const labelTestID = hasDateSelected ? TransactionFiltersSelector.DateChipActive : TransactionFiltersSelector.DateChip;

    return (
        <View className="min-h-[44px] flex-row items-center rounded-3xl bg-grouped-surface-row" style={continuousCorners}>
            <StatisticsPeriodStepButton
                icon={UserIconNameEnum.ChevronLeft}
                range={previousRange}
                accessibilityLabel={t`Previous period`}
                onChange={onChange}
            />

            <HapticPressable
                accessibilityRole="button"
                accessibilityHint={t`Choose a period`}
                className="min-h-[44px] flex-1 items-center justify-center py-xs active:scale-100 active:opacity-60"
                hitSlop={0}
                testID={labelTestID}
                onPress={handleOpen}
            >
                <Animated.View key={label} entering={FadeIn.duration(180)}>
                    <Text
                        numberOfLines={2}
                        maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                        className="text-center text-md font-semibold text-primary"
                    >
                        {label}
                    </Text>
                </Animated.View>
            </HapticPressable>

            <StatisticsPeriodStepButton
                icon={UserIconNameEnum.ChevronRight}
                range={nextRange}
                accessibilityLabel={t`Next period`}
                onChange={onChange}
            />
        </View>
    );
};
