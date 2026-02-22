import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';

interface Props {
    readonly day: number;
    readonly entries: readonly RecurringCalendarEntryInterface[];
}

export const RecurringCalendarDayDetail = ({ day, entries }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    return (
        <View className="gap-y-lg">
            <Text className="uppercase text-secondary-foreground text-xs">
                <Trans>Day {day} - Recurring payments</Trans>
            </Text>

            {entries.map(entry => {
                const formattedAmount = formatDigits(convertFromMicroUnits(entry.latestAmount), defaultInstrument.symbol);
                const description = t`${formattedAmount} · ${entry.categoryTitle}`;

                return (
                    <SimpleHorizontalCell
                        key={`${entry.categoryId}-${entry.title}`}
                        left={<CircleIcon icon={entry.categoryIcon} variant="destructive" />}
                        title={entry.title}
                        description={description}
                    />
                );
            })}
        </View>
    );
};
