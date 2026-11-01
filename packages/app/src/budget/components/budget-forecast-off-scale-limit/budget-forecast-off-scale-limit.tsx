import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';

interface Props {
    readonly label: string;
    readonly scaleLabel: string;
    readonly top: number;
    readonly fontSize: number;
}

const SCALE_LABEL_DROP = 2;

export const BudgetForecastOffScaleLimit = ({ label, scaleLabel, top, fontSize }: Props) => {
    const scaleY = top + fontSize - SCALE_LABEL_DROP;
    const scaleFontSize = fontSize - 1;

    return (
        <>
            <StyledSvgText x={0} y={fontSize} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="start">
                {label}
            </StyledSvgText>
            <StyledSvgText x={0} y={scaleY} fillClassName="accent-secondary-foreground" fontSize={scaleFontSize} textAnchor="start">
                {scaleLabel}
            </StyledSvgText>
        </>
    );
};
