import { useLingui } from '@lingui/react/macro';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly x: number;
    readonly top: number;
    readonly bottom: number;
    readonly runOutAt: Date;
    readonly fontSize: number;
    readonly dash: string;
}

const LABEL_LIFT = 10;

export const BudgetForecastRunOut = ({ x, top, bottom, runOutAt, fontSize, dash }: Props) => {
    const { t } = useLingui();
    const runOutDate = useFormatDate().formatMonthAndDay(runOutAt);
    const labelY = top - LABEL_LIFT;

    return (
        <>
            <StyledLine
                x1={x}
                y1={top}
                x2={x}
                y2={bottom}
                strokeClassName="accent-warning-foreground"
                strokeDasharray={dash}
                strokeWidth={1}
            />
            <StyledSvgText
                x={x}
                y={labelY}
                fillClassName="accent-warning-foreground"
                fontSize={fontSize}
                fontWeight="600"
                textAnchor="middle"
            >
                {t`Runs out ~${runOutDate}`}
            </StyledSvgText>
        </>
    );
};
