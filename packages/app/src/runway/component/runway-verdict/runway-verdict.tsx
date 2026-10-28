import { RUNWAY_MAX_MONTHS } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { StatusLabel } from '../../../@generic/component/status-label/status-label';
import { RunwayMeter } from '../runway-meter/runway-meter';
import { RunwayVerdictFigure } from '../runway-verdict-figure/runway-verdict-figure';
import { RunwayVerdictOutlook } from '../runway-verdict-outlook/runway-verdict-outlook';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

export const RunwayVerdict = ({ computation }: Props) => {
    const { t } = useLingui();

    const { isPositive, runwayMonths } = computation;
    const tone = isPositive ? 'positive' : 'destructive';
    const statusLabel = isPositive ? t`Growing` : t`Burning`;
    const meterMonths = isPositive ? RUNWAY_MAX_MONTHS : runwayMonths;

    return (
        <EntranceReveal step={0} className="gap-y-md">
            <StatusLabel label={statusLabel} tone={tone} />

            <RunwayVerdictFigure computation={computation} />

            <RunwayVerdictOutlook computation={computation} />

            <RunwayMeter months={meterMonths} tone={tone} />
        </EntranceReveal>
    );
};
