import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { MakeRecurringSheetSelector } from '../make-recurring-sheet/make-recurring-sheet.selector';
import { RecurringListRowContent } from '../recurring-list-row-content/recurring-list-row-content';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: RecurringSeriesListItemInterface;
    readonly onSelect: (series: RecurringSeriesListItemInterface) => void;
    readonly now: Date;
}

export const MakeRecurringFittingRow = ({ series, onSelect, now }: Props) => {
    const handlePress = () => void onSelect(series);

    return (
        <GroupedListRow
            title={<RecurringListRowContent series={series} isPossible={false} now={now} />}
            onPress={handlePress}
            testID={MakeRecurringSheetSelector.FittingRow(series.title)}
        />
    );
};
