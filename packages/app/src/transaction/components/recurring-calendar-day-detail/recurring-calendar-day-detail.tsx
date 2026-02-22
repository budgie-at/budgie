import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';

const ANIMATION_STAGGER = 50;

interface Props {
    readonly day: number;
    readonly entries: readonly RecurringCalendarEntryInterface[];
}

export const RecurringCalendarDayDetail = ({ day, entries }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const dayTotal = entries.reduce((sum, entry) => sum + entry.latestAmount, 0);
    const formattedDayTotal = formatDigits(convertFromMicroUnits(dayTotal), defaultInstrument.symbol);

    return (
        <View className="gap-y-lg">
            <View className="flex-row items-center justify-between">
                <Text className="uppercase text-secondary-foreground text-xs font-semibold">
                    <Trans>Day {day}</Trans>
                </Text>
                <Text className="text-destructive text-sm font-bold">{formattedDayTotal}</Text>
            </View>

            {entries.map((entry, index) => {
                const amount = convertFromMicroUnits(entry.latestAmount);
                const formattedAmount = formatDigits(amount, defaultInstrument.symbol);
                const category = entry.categoryTitle;
                const description = t`${formattedAmount} · ${category}`;
                const animationDelay = index * ANIMATION_STAGGER;

                return (
                    <Animated.View key={`${entry.categoryId}-${entry.title}`} entering={FadeInDown.delay(animationDelay).duration(200)}>
                        <SimpleHorizontalCell
                            left={<CircleIcon icon={entry.categoryIcon} variant="destructive" />}
                            title={entry.title}
                            description={description}
                        />
                    </Animated.View>
                );
            })}
        </View>
    );
};
