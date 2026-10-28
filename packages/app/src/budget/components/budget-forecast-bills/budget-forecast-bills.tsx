import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';

import type { BudgetForecastBillPointInterface } from '../../interface/budget-forecast-bill-point.interface';

interface Props {
    readonly bills: readonly BudgetForecastBillPointInterface[];
}

const BILL_RADIUS = 2.5;

export const BudgetForecastBills = ({ bills }: Props) =>
    bills.map(bill => (
        <StyledCircle
            key={bill.key}
            cx={bill.x}
            cy={bill.y}
            r={BILL_RADIUS}
            fillClassName="accent-warning-fill"
            strokeClassName="accent-primary-reverse dark:accent-secondary-background"
            strokeWidth={1.5}
        />
    ));
