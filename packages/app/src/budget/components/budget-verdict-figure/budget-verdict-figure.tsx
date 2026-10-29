import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetVerdictFigure = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const isOver = scope.status === BudgetPaceStatusEnum.OVER;
    const figureAmount = isOver ? scope.spent - scope.limit : scope.safePerDay;
    const unit = isOver ? t`over` : t`/ day`;

    return <HeroFigure amount={convertFromMicroUnits(figureAmount)} currencySymbol={currencySymbol} variant="primary" unit={unit} />;
};
