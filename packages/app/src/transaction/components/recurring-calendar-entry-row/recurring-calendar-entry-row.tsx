import { RecurringSeriesUserStateEnum, UserIconNameEnum } from '@budgie/contracts';
import { RecurringAlertEnum, RecurringService } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
import { RecurringSeriesTitleInput } from '../recurring-series-title-input/recurring-series-title-input';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

const ANIMATION_STAGGER = 50;
const MAX_STAGGER_INDEX = 8;

interface Props {
    readonly entry: RecurringCalendarEntryInterface;
    readonly index: number;
    readonly onPress?: () => void;
    readonly dayLabel?: string;
}

// eslint-disable-next-line max-statements -- Row derives navigation, day-label, alert and series-action affordances from entry data
export const RecurringCalendarEntryRow = ({ entry, index, onPress, dayLabel }: Props) => {
    const router = useRouter();
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const [isRenaming, setIsRenaming] = useState(false);

    const amount = convertFromMicroUnits(entry.latestAmount);
    const formattedAmount = formatDigits(amount, defaultInstrument.symbol);
    const alertLabels = { [RecurringAlertEnum.OVERDUE]: t`Overdue`, [RecurringAlertEnum.PRICE_CHANGE]: t`Price changed` };
    const detail = isDefined(entry.alert) ? alertLabels[entry.alert] : (entry.categoryTitle ?? entry.title);
    const description = t`${formattedAmount} · ${detail}`;
    const icon = entry.categoryIcon ?? UserIconNameEnum.Wallet;
    const animationDelay = Math.min(index, MAX_STAGGER_INDEX) * ANIMATION_STAGGER;
    let handlePress = onPress;

    if (!isDefined(handlePress) && isDefined(entry.latestTransactionId)) {
        handlePress = () => {
            router.push({
                pathname: entry.latestAmount < 0 ? '/transactions/[id]/income' : '/transactions/[id]/expense',
                params: { id: String(entry.latestTransactionId) }
            });
        };
    }

    const setUserState = (userState: RecurringSeriesUserStateEnum) =>
        void appRuntime
            .runPromise(Effect.flatMap(RecurringService, recurringService => recurringService.setUserState(entry.seriesId, userState)))
            .catch(() => void Toast.show({ type: 'error', text1: t`Could not update recurring payment.` }));

    const handleDismiss = () => void setUserState(RecurringSeriesUserStateEnum.DISMISSED);
    const handleRenameDone = () => void setIsRenaming(false);
    const confirmButtons =
        entry.userState === RecurringSeriesUserStateEnum.SUGGESTED
            ? [{ text: t`Confirm`, onPress: () => void setUserState(RecurringSeriesUserStateEnum.CONFIRMED) }]
            : [];

    const handleLongPress = () =>
        void Alert.alert(entry.title, t`Swipe left to dismiss this recurring payment.`, [
            ...confirmButtons,
            { text: t`Rename`, onPress: () => void setIsRenaming(true) },
            { text: t`Cancel`, style: 'cancel' }
        ]);

    const right = isNotEmptyString(dayLabel) ? (
        <View className="ml-auto">
            <Text className="text-xs text-secondary-foreground">{dayLabel}</Text>
        </View>
    ) : null;

    const dismissConfirmation = {
        title: t`Dismiss recurring payment?`,
        description: t`It will no longer appear in the calendar.`,
        buttonText: t`Dismiss`
    };

    return (
        <Animated.View key={entry.key} entering={FadeInDown.delay(animationDelay).duration(200)}>
            {isRenaming ? (
                <RecurringSeriesTitleInput seriesId={entry.seriesId} title={entry.title} onDone={handleRenameDone} />
            ) : (
                <DeletableRow id={entry.seriesId} onDelete={handleDismiss} confirmation={dismissConfirmation}>
                    <SimpleHorizontalCell
                        testID={RecurringCalendarSelector.Row(entry.title)}
                        left={<CircleIcon icon={icon} variant="destructive" />}
                        title={entry.title}
                        description={description}
                        onLongPress={handleLongPress}
                        {...(isDefined(handlePress) && { onPress: handlePress })}
                        {...(isDefined(right) && { right })}
                    />
                </DeletableRow>
            )}
        </Animated.View>
    );
};
