import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RunwaySelector } from '../../runway.selector';

import type { RunwayComputationInterface } from '../../interface/runway-computation.interface';

interface Props {
    readonly computation: RunwayComputationInterface;
}

export const RunwayVerdictFigure = ({ computation }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatWholeDigits = useFormatDigits(0);

    const { isPositive, net, runwayMonths } = computation;
    const netAmount = convertFromMicroUnits(net);
    const monthsLeft = Math.round(runwayMonths ?? 0);
    const growingTestID = RunwaySelector.VerdictFigure(`+${formatWholeDigits(netAmount, defaultInstrument.symbol)}`);
    const burningTestID = RunwaySelector.VerdictFigure(`≈ ${formatWholeDigits(monthsLeft)}`);
    const growingProps = {
        amount: netAmount,
        currencySymbol: defaultInstrument.symbol,
        prefix: '+',
        decimalPlaces: 0,
        unit: t`per month`,
        testID: growingTestID
    };
    const burningProps = {
        amount: monthsLeft,
        currencySymbol: '',
        prefix: '≈',
        decimalPlaces: 0,
        unit: t`months left`,
        testID: burningTestID
    };
    const figureProps = isPositive ? growingProps : burningProps;

    return <HeroFigure variant="primary" {...figureProps} />;
};
