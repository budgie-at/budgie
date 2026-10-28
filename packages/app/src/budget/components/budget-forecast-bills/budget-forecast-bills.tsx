import { G } from 'react-native-svg';

import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';

import type { BudgetForecastBillPointInterface } from '../../interface/budget-forecast-bill-point.interface';

interface Props {
    readonly bills: readonly BudgetForecastBillPointInterface[];
    readonly fontSize: number;
}

const BILL_RADIUS = 3;

export const BudgetForecastBills = ({ bills, fontSize }: Props) =>
    bills.map(bill => (
        <G key={bill.key}>
            <StyledCircle
                cx={bill.x}
                cy={bill.y}
                r={BILL_RADIUS}
                fillClassName="accent-warning-foreground"
                strokeClassName="accent-primary-reverse dark:accent-secondary-background"
                strokeWidth={1.5}
            />
            <StyledSvgText x={bill.x} y={bill.labelY} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="middle">
                {bill.title}
            </StyledSvgText>
        </G>
    ));
