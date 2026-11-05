import { RecurringSeriesSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { useRemoveRecurringSeries } from '../../hook/use-remove-recurring-series.hook';
import { RecurringListRowContent } from '../recurring-list-row-content/recurring-list-row-content';
import { RecurringPaneSelector } from '../recurring-pane/recurring-pane.selector';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: RecurringSeriesListItemInterface;
    readonly position: TransactionListRowPositionEnum;
    readonly isPossible: boolean;
}

export const RecurringListRow = ({ series, position, isPossible }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const removeSeries = useRemoveRecurringSeries();
    const swipeLabel = series.source === RecurringSeriesSourceEnum.DETECTED ? t`Not recurring` : t`Delete`;

    const handleOpen = () => void router.push({ pathname: '/recurring/[id]', params: { id: String(series.id) } });
    const handleRemove = () => void removeSeries(series);

    return (
        <TransactionRowSurface position={position}>
            <DeletableRow id={series.id} onDelete={handleRemove} label={swipeLabel}>
                <HapticPressable
                    accessibilityRole="button"
                    className="px-3xl py-xl active:scale-100 active:opacity-70"
                    onPress={handleOpen}
                    testID={RecurringPaneSelector.Row(series.title)}
                >
                    <RecurringListRowContent series={series} isPossible={isPossible} />
                </HapticPressable>
            </DeletableRow>
        </TransactionRowSurface>
    );
};
