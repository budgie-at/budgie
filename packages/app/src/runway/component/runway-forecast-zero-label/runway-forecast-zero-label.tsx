import { useAtomValue } from '@effect/atom-react/Hooks';

import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RUNWAY_CHART_LABEL_FONT_SIZE } from '../../constant/runway-chart-label-font-size.constant';

interface Props {
    readonly x: number;
    readonly y: number;
}

const LABEL_GAP = 3;

export const RunwayForecastZeroLabel = ({ x, y }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useFormatDigits(0);
    const labelY = y - LABEL_GAP;

    return (
        <StyledSvgText
            x={x}
            y={labelY}
            fillClassName="accent-secondary-foreground"
            fontSize={RUNWAY_CHART_LABEL_FONT_SIZE}
            textAnchor="start"
        >
            {formatDigits(0, defaultInstrument.symbol)}
        </StyledSvgText>
    );
};
