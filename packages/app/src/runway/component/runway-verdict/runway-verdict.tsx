import { useLingui } from '@lingui/react/macro';
import Animated, { FadeIn } from 'react-native-reanimated';

import { StatusLabel } from '../../../@generic/component/status-label/status-label';
import { RunwayMeter } from '../runway-meter/runway-meter';
import { RunwayVerdictFigure } from '../runway-verdict-figure/runway-verdict-figure';
import { RunwayVerdictOutlook } from '../runway-verdict-outlook/runway-verdict-outlook';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

const ENTERING_DURATION = 240;
const ENTERING = FadeIn.duration(ENTERING_DURATION);

export const RunwayVerdict = ({ computation }: Props) => {
    const { t } = useLingui();

    const { isPositive, runwayMonths } = computation;
    const tone = isPositive ? 'positive' : 'destructive';
    const statusLabel = isPositive ? t`Growing` : t`Burning`;

    return (
        <Animated.View entering={ENTERING} className="gap-y-md">
            <StatusLabel label={statusLabel} tone={tone} />

            <RunwayVerdictFigure computation={computation} />

            <RunwayVerdictOutlook computation={computation} />

            {isPositive ? null : <RunwayMeter months={runwayMonths} />}
        </Animated.View>
    );
};
