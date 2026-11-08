import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { RecurringCalendarSelector } from '../recurring-calendar-content/recurring-calendar.selector';
import { RecurringCalendarEntryContent } from '../recurring-calendar-entry-content/recurring-calendar-entry-content';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { RecurringCalendarEntryInterface } from '@budgie/recurring';

interface Props {
    readonly entry: RecurringCalendarEntryInterface;
    readonly position: TransactionListRowPositionEnum;
    readonly dayLabel?: string;
}

export const RecurringCalendarEntryRow = ({ entry, position, dayLabel }: Props) => {
    const router = useRouter();
    const { latestTransactionId } = entry;
    const hasTransaction = isDefined(latestTransactionId);

    const handlePress = () => {
        if (hasTransaction) {
            router.push({ pathname: '/transactions/[id]/expense', params: { id: String(latestTransactionId) } });
        }
    };

    return (
        <TransactionRowSurface position={position}>
            <HapticPressable
                pressedScale={1}
                className="px-3xl py-xl active:opacity-70"
                testID={RecurringCalendarSelector.Row(entry.title)}
                {...(hasTransaction && { onPress: handlePress, accessibilityRole: 'button' as const })}
            >
                <RecurringCalendarEntryContent entry={entry} dayLabel={dayLabel} />
            </HapticPressable>
        </TransactionRowSurface>
    );
};
