import { RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { TransactionListRowPositionEnum } from '../../enum/transaction-list-row-position.enum';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
import { RecurringCalendarEntryContent } from '../recurring-calendar-entry-content/recurring-calendar-entry-content';
import { RecurringSeriesTitleInput } from '../recurring-series-title-input/recurring-series-title-input';
import { TransactionRowSurface } from '../transaction-row-surface/transaction-row-surface';

import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

interface Props {
    readonly entry: RecurringCalendarEntryInterface;
    readonly position: TransactionListRowPositionEnum;
    readonly onPress?: () => void;
    readonly dayLabel?: string;
}

export const RecurringCalendarEntryRow = ({ entry, position, onPress, dayLabel }: Props) => {
    const router = useRouter();
    const { t } = useLingui();
    const [isRenaming, setIsRenaming] = useState(false);
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
            ? [{ text: t`Confirm recurring`, onPress: () => void setUserState(RecurringSeriesUserStateEnum.CONFIRMED) }]
            : [];

    const handleLongPress = () =>
        void Alert.alert(entry.title, void 0, [
            ...confirmButtons,
            { text: t`Rename`, onPress: () => void setIsRenaming(true) },
            { text: t`Cancel`, style: 'cancel' }
        ]);

    return (
        <TransactionRowSurface position={position}>
            {isRenaming ? (
                <RecurringSeriesTitleInput seriesId={entry.seriesId} title={entry.title} onDone={handleRenameDone} />
            ) : (
                <DeletableRow id={entry.seriesId} onDelete={handleDismiss} label={t`Dismiss`}>
                    <HapticPressable
                        className="px-3xl py-xl active:scale-100 active:opacity-70"
                        testID={RecurringCalendarSelector.Row(entry.title)}
                        onLongPress={handleLongPress}
                        {...(isDefined(handlePress) && { onPress: handlePress, accessibilityRole: 'button' as const })}
                    >
                        <RecurringCalendarEntryContent entry={entry} dayLabel={dayLabel} />
                    </HapticPressable>
                </DeletableRow>
            )}
        </TransactionRowSurface>
    );
};
