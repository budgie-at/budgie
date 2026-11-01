import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { findRiskiestAheadScope } from '../../utils/find-riskiest-ahead-scope.util';
import { BudgetPaceHintCategory } from '../budget-pace-hint-category/budget-pace-hint-category';
import { BudgetPaceHintLine } from '../budget-pace-hint-line/budget-pace-hint-line';

import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
    readonly onPress: (target: BudgetHighlightTargetInterface) => void;
}

export const BudgetPaceHint = ({ projection, currencySymbol, onPress }: Props) => {
    const { t } = useLingui();
    const aheadScope = findRiskiestAheadScope(projection);

    if (!isDefined(aheadScope)) {
        return null;
    }

    const { target, scope } = aheadScope;

    const handlePress = () => {
        onPress(target);
    };

    if (isDefined(target.categoryId)) {
        return (
            <BudgetPaceHintCategory categoryId={target.categoryId} scope={scope} currencySymbol={currencySymbol} onPress={handlePress} />
        );
    }

    return (
        <BudgetPaceHintLine
            icon={UserIconNameEnum.CircleEllipsis}
            title={t`Other`}
            scope={scope}
            currencySymbol={currencySymbol}
            onPress={handlePress}
        />
    );
};
