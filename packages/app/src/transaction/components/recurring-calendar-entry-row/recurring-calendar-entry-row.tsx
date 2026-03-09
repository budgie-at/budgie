import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RecurringCalendarEntryInterface } from '../../interface/recurring-calendar-entry.interface';
import { getRecurringEntryKey } from '../../utils/get-recurring-entry-key.util';

const ANIMATION_STAGGER = 50;

interface Props {
    readonly entry: RecurringCalendarEntryInterface;
    readonly index: number;
    readonly onPress?: () => void;
    readonly dayLabel?: string;
}

// eslint-disable-next-line max-statements -- Row derives optional navigation and day-label affordances from entry data
export const RecurringCalendarEntryRow = ({ entry, index, onPress, dayLabel }: Props) => {
    const router = useRouter();
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const amount = convertFromMicroUnits(entry.latestAmount);
    const formattedAmount = formatDigits(amount, defaultInstrument.symbol);
    const category = entry.categoryTitle ?? entry.title;
    const description = t`${formattedAmount} · ${category}`;
    const icon = entry.categoryIcon ?? UserIconNameEnum.Wallet;
    const animationDelay = index * ANIMATION_STAGGER;
    const key = getRecurringEntryKey(entry);
    let handlePress = onPress;

    if (!isDefined(handlePress) && isDefined(entry.latestTransactionId)) {
        handlePress = () => {
            router.push(`/transactions/${entry.latestTransactionId}/expense`);
        };
    }

    const right = isNotEmptyString(dayLabel) ? (
        <View className="ml-auto">
            <Text className="text-xs text-secondary-foreground">{dayLabel}</Text>
        </View>
    ) : null;

    return (
        <Animated.View key={key} entering={FadeInDown.delay(animationDelay).duration(200)}>
            <SimpleHorizontalCell
                left={<CircleIcon icon={icon} variant="destructive" />}
                title={entry.title}
                description={description}
                {...(isDefined(handlePress) && { onPress: handlePress })}
                {...(right !== null && { right })}
            />
        </Animated.View>
    );
};
