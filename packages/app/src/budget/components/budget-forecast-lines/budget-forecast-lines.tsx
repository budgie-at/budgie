import { StyledPath } from '../../../@generic/component/styled-path/styled-path';

interface Props {
    readonly actualPath: string;
    readonly projectedPath: string;
    readonly accentClassName: string;
    readonly dash: string;
}

export const BudgetForecastLines = ({ actualPath, projectedPath, accentClassName, dash }: Props) => (
    <>
        <StyledPath
            d={projectedPath}
            fill="none"
            strokeClassName={accentClassName}
            strokeDasharray={dash}
            strokeWidth={2}
            strokeLinecap="round"
        />
        <StyledPath
            d={actualPath}
            fill="none"
            strokeClassName="accent-primary"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </>
);
