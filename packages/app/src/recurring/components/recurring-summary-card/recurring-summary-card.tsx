import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RecurringPaneSelector } from '../recurring-pane/recurring-pane.selector';
import { RecurringSummaryRow } from '../recurring-summary-row/recurring-summary-row';

import type { RecurringSummaryInterface } from '../../interface/recurring-summary.interface';

interface Props {
    readonly summary: RecurringSummaryInterface;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringSummaryCard = ({ summary }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const { committedMonthly, dueSoonTotal, dueSoonCount, incomeMonthly } = summary;
    const hasCommitted = isPositiveNumber(committedMonthly);
    const hasDueSoon = isPositiveNumber(dueSoonCount);
    const hasIncome = isPositiveNumber(incomeMonthly);
    const committedAmount = protectAmount(convertFromMicroUnits(committedMonthly), defaultInstrument.symbol);
    const dueSoonAmount = protectAmount(convertFromMicroUnits(dueSoonTotal), defaultInstrument.symbol);
    const incomeAmount = protectAmount(convertFromMicroUnits(incomeMonthly), defaultInstrument.symbol);
    const paymentsLabel = t({ message: plural(dueSoonCount, { one: '# payment', other: '# payments' }) });

    if (!hasCommitted && !hasDueSoon && !hasIncome) {
        return null;
    }

    return (
        <View
            className="mb-xl rounded-3xl bg-grouped-surface-row px-3xl py-sm"
            style={continuousCorners}
            testID={RecurringPaneSelector.Summary}
        >
            {hasCommitted ? <RecurringSummaryRow title={t`Committed`} value={t`≈ ${committedAmount} / month`} /> : null}
            {hasDueSoon ? <RecurringSummaryRow title={t`Due next 7 days`} value={`${dueSoonAmount} · ${paymentsLabel}`} /> : null}
            {hasIncome ? <RecurringSummaryRow title={t`Recurring income`} value={t`${incomeAmount} / month`} /> : null}
        </View>
    );
};
