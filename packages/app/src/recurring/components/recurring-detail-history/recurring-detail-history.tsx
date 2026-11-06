import { RecurringSeriesKindEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { RecurringDetailHistoryRow } from '../recurring-detail-history-row/recurring-detail-history-row';
import { RecurringDetailSection } from '../recurring-detail-section/recurring-detail-section';

import type { RecurringHistoryItemInterface } from '@budgie/recurring';

interface Props {
    readonly seriesId: number;
    readonly kind: RecurringSeriesKindEnum;
    readonly history: readonly RecurringHistoryItemInterface[];
}

export const RecurringDetailHistory = ({ seriesId, kind, history }: Props) => {
    const { t } = useLingui();
    const linked = history.filter(item => !item.isExcluded);

    if (!isNotEmptyArray(linked)) {
        return null;
    }

    return (
        <RecurringDetailSection title={t`Payment history`}>
            {linked.map(item => (
                <RecurringDetailHistoryRow key={item.transactionId} seriesId={seriesId} kind={kind} item={item} />
            ))}
        </RecurringDetailSection>
    );
};
