import { RecurringSeriesUserStateEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { RecurringAlertEnum, RecurringService } from '@budgie/recurring';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { TransactionListRowPositionEnum } from '../../enum/transaction-list-row-position.enum';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
import { RecurringSeriesTitleInput } from '../recurring-series-title-input/recurring-series-title-input';
import { TransactionRowLayout } from '../transaction-row-layout/transaction-row-layout';
import { TransactionRowSurface } from '../transaction-row-surface/transaction-row-surface';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

interface Props {
    readonly entry: RecurringCalendarEntryInterface;
    readonly position: TransactionListRowPositionEnum;
    readonly onPress?: () => void;
    readonly dayLabel?: string;
}

// eslint-disable-next-line max-statements -- Row derives navigation, day-label, alert and series-action affordances from entry data
export const RecurringCalendarEntryRow = ({ entry, position, onPress, dayLabel }: Props) => {
    const router = useRouter();
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const [isRenaming, setIsRenaming] = useState(false);

    const formattedAmount = protectAmount(convertFromMicroUnits(entry.latestAmount), defaultInstrument.symbol);
    const alertLabels = {
        [RecurringAlertEnum.OVERDUE]: t`Overdue`,
        [RecurringAlertEnum.PRICE_CHANGE]: t`Price changed`
    };
    const detail = isDefined(entry.alert) ? alertLabels[entry.alert] : (entry.categoryTitle ?? entry.title);
    const description = isNotEmptyString(dayLabel) ? `${dayLabel} · ${detail}` : detail;
    const icon = entry.categoryIcon ?? UserIconNameEnum.Wallet;
    let handlePress = onPress;

    if (!isDefined(handlePress) && isDefined(entry.latestTransactionId)) {
        handlePress = () => {
            router.push({
                pathname: '/transactions/[id]/expense',
                params: { id: String(entry.latestTransactionId) }
            });
        };
    }

    const setUserState = (userState: RecurringSeriesUserStateEnum) =>
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(RecurringService, recurringService => recurringService.setUserState(entry.seriesId, userState)).pipe(
                    toastOnFailure(t`Could not update recurring payment.`)
                )
            )
        );

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

    const dismissConfirmation = {
        title: t`Dismiss recurring payment?`,
        description: t`It will no longer appear in the calendar.`,
        buttonText: t`Dismiss`
    };

    return (
        <TransactionRowSurface position={position}>
            {isRenaming ? (
                <RecurringSeriesTitleInput seriesId={entry.seriesId} title={entry.title} onDone={handleRenameDone} />
            ) : (
                <DeletableRow id={entry.seriesId} onDelete={handleDismiss} confirmation={dismissConfirmation}>
                    <HapticPressable
                        className="px-3xl py-xl active:scale-100 active:opacity-70"
                        testID={RecurringCalendarSelector.Row(entry.title)}
                        onLongPress={handleLongPress}
                        {...(isDefined(handlePress) && { onPress: handlePress, accessibilityRole: 'button' as const })}
                    >
                        <TransactionRowLayout
                            icon={<CircleIcon size={36} iconSize={18} radius={18} border={false} icon={icon} variant="secondary" />}
                            amount={<Text className="text-[15px] font-semibold text-primary tabular-nums">{formattedAmount}</Text>}
                        >
                            <Text className="text-[15px] font-semibold text-primary" numberOfLines={1}>
                                {entry.title}
                            </Text>
                            <Text className="text-[13px] text-secondary-foreground" numberOfLines={1}>
                                {description}
                            </Text>
                        </TransactionRowLayout>
                    </HapticPressable>
                </DeletableRow>
            )}
        </TransactionRowSurface>
    );
};
