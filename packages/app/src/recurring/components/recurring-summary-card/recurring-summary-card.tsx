import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RecurringPaneSelector } from '../recurring-pane/recurring-pane.selector';

import type { RecurringSummaryInterface } from '../../interface/recurring-summary.interface';

interface Props {
    readonly summary: RecurringSummaryInterface;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringSummaryCard = ({ summary }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const { committedMonthly, committedCount, dueSoonTotal, dueSoonCount, incomeMonthly } = summary;
    const hasCommitted = isPositiveNumber(committedMonthly);
    const hasDueSoon = isPositiveNumber(dueSoonCount);
    const hasIncome = isPositiveNumber(incomeMonthly);
    const committedAmount = protectAmount(convertFromMicroUnits(committedMonthly), defaultInstrument.symbol);
    const dueSoonAmount = protectAmount(convertFromMicroUnits(dueSoonTotal), defaultInstrument.symbol);
    const incomeAmount = protectAmount(convertFromMicroUnits(incomeMonthly), defaultInstrument.symbol);
    const countLabel = t({ message: plural(committedCount, { one: '# bill or subscription', other: '# bills and subscriptions' }) });
    const dueSoonLabel = hasDueSoon ? t`${dueSoonAmount} due this week` : t`Nothing due this week`;

    if (!hasCommitted && !hasIncome) {
        return null;
    }

    return (
        <View
            className="mb-md gap-y-md rounded-3xl bg-grouped-surface-row px-3xl py-2xl"
            style={continuousCorners}
            testID={RecurringPaneSelector.Summary}
        >
            <Text dynamicTypeRamp="footnote" className="text-[13px] font-medium text-secondary-foreground">
                <Trans>Recurring spending</Trans>
            </Text>
            <View className="flex-row flex-wrap items-baseline gap-x-xs">
                <ProtectedText dynamicTypeRamp="largeTitle" className="text-[34px] font-bold text-primary tabular-nums">
                    {committedAmount}
                </ProtectedText>
                <Text dynamicTypeRamp="title3" className="text-[17px] font-medium text-secondary-foreground">
                    <Trans>/ month</Trans>
                </Text>
            </View>
            <Text dynamicTypeRamp="subheadline" className="text-[15px] text-secondary-foreground">
                {`${countLabel} · ${dueSoonLabel}`}
            </Text>
            {hasIncome ? (
                <View className="flex-row items-center justify-between border-t border-surface-separator pt-md">
                    <Text dynamicTypeRamp="subheadline" className="text-[15px] text-primary">
                        <Trans>Recurring income</Trans>
                    </Text>
                    <ProtectedText dynamicTypeRamp="headline" className="text-[15px] font-semibold text-positive-strong tabular-nums">
                        {t`${incomeAmount} / month`}
                    </ProtectedText>
                </View>
            ) : null}
        </View>
    );
};
