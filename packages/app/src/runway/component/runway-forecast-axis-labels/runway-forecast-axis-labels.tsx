import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { RUNWAY_CHART_LABEL_FONT_SIZE } from '../../constant/runway-chart-label-font-size.constant';
import { RUNWAY_HORIZON_MONTHS } from '../../constant/runway-horizon-months.constant';
import { useRunwayTickLabel } from '../../hook/use-runway-tick-label.hook';

interface Props {
    readonly tickXs: readonly number[];
    readonly y: number;
}

const LAST_TICK_INDEX = RUNWAY_HORIZON_MONTHS.length - 1;

export const RunwayForecastAxisLabels = ({ tickXs, y }: Props) => {
    const getTickLabel = useRunwayTickLabel();

    return (
        <>
            {tickXs.map((x, index) => {
                const isFirst = index === 0;
                const middleAnchor = index === LAST_TICK_INDEX ? 'end' : 'middle';
                const textAnchor = isFirst ? 'start' : middleAnchor;

                return (
                    <StyledSvgText
                        key={x}
                        x={x}
                        y={y}
                        fillClassName="accent-secondary-foreground"
                        fontSize={RUNWAY_CHART_LABEL_FONT_SIZE}
                        textAnchor={textAnchor}
                    >
                        {getTickLabel(index)}
                    </StyledSvgText>
                );
            })}
        </>
    );
};
