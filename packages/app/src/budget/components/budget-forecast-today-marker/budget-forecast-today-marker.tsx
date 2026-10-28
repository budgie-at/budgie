import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';

import type { BudgetForecastPointInterface } from '../../interface/budget-forecast-point.interface';

interface Props {
    readonly point: BudgetForecastPointInterface;
    readonly accentClassName: string;
}

const HALO_RADIUS = 8;
const HALO_OPACITY = 0.18;
const DOT_RADIUS = 3.5;

export const BudgetForecastTodayMarker = ({ point, accentClassName }: Props) => (
    <>
        <StyledCircle cx={point.x} cy={point.y} r={HALO_RADIUS} fillClassName={accentClassName} opacity={HALO_OPACITY} />
        <StyledCircle cx={point.x} cy={point.y} r={DOT_RADIUS} fillClassName={accentClassName} />
    </>
);
