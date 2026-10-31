import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';
import { View } from 'react-native';

import { HUNDRED_THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RunwaySelector } from '../../runway.selector';
import { RunwayFlowStat } from '../runway-flow-stat/runway-flow-stat';
import { RunwaySection } from '../runway-section/runway-section';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

export const RunwayFlowRow = ({ computation }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useFormatDigits(0);
    const formatCompactDigits = useFormatCompactDigits();

    const net = convertFromMicroUnits(computation.net);
    const negativeOrNeutralVariant = Math.abs(net) <= 1 ? 'warning' : 'destructive';
    const netVariant = net > 1 ? 'positive' : negativeOrNeutralVariant;
    const netSign = net > 1 ? '+' : '';

    const formatFlow = (amount: number) => {
        const formatted =
            Math.abs(amount) >= HUNDRED_THOUSAND
                ? formatCompactDigits(amount, defaultInstrument.symbol)
                : formatDigits(amount, defaultInstrument.symbol);

        return formatted.replaceAll('-', '−');
    };

    const stats = [
        { label: t`Expenses`, value: formatFlow(convertFromMicroUnits(computation.burn)), variant: 'primary' },
        { label: t`Income`, value: formatFlow(convertFromMicroUnits(computation.income)), variant: 'primary' },
        { label: t`Net`, value: `${netSign}${formatFlow(net)}`, variant: netVariant }
    ] as const;

    return (
        <RunwaySection title={t`Typical month`} testID={RunwaySelector.FlowRow}>
            <View className="flex-row">
                {stats.map((stat, index) => (
                    <Fragment key={stat.label}>
                        {index > 0 ? <View className="my-xl w-hairline bg-surface-separator" /> : null}
                        <RunwayFlowStat label={stat.label} value={stat.value} variant={stat.variant} />
                    </Fragment>
                ))}
            </View>
        </RunwaySection>
    );
};
