import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { HairlineStatRow } from '../../../@generic/component/hairline-stat-row/hairline-stat-row';
import { HUNDRED_THOUSAND } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RunwaySelector } from '../../runway.selector';

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
        { label: t`Net`, value: formatFlow(net), variant: netVariant }
    ] as const;

    return (
        <View collapsable={false} testID={RunwaySelector.FlowRow}>
            <HairlineStatRow stats={stats} />
        </View>
    );
};
