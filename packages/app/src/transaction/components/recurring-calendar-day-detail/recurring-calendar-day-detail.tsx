import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';

const ANIMATION_STAGGER = 50;

interface Props {
    readonly entries: readonly RecurringCalendarEntryInterface[];
}

export const RecurringCalendarDayDetail = ({ entries }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    return (
        <View className="gap-y-lg">
            {entries.map((entry, index) => {
                const amount = convertFromMicroUnits(entry.latestAmount);
                const formattedAmount = formatDigits(amount, defaultInstrument.symbol);
                const category = entry.categoryTitle ?? entry.title;
                const description = t`${formattedAmount} · ${category}`;
                const icon = entry.categoryIcon ?? UserIconNameEnum.Wallet;
                const animationDelay = index * ANIMATION_STAGGER;

                return (
                    <Animated.View key={entry.title} entering={FadeInDown.delay(animationDelay).duration(200)}>
                        <SimpleHorizontalCell
                            left={<CircleIcon icon={icon} variant="destructive" />}
                            title={entry.title}
                            description={description}
                        />
                    </Animated.View>
                );
            })}
        </View>
    );
};
