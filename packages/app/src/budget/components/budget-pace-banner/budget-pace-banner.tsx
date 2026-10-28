import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { findRiskiestAheadScope } from '../../utils/find-riskiest-ahead-scope.util';
import { BudgetPaceBannerCard } from '../budget-pace-banner-card/budget-pace-banner-card';
import { BudgetPaceCategoryBanner } from '../budget-pace-category-banner/budget-pace-category-banner';

import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
    readonly onPress: (target: BudgetHighlightTargetInterface) => void;
}

export const BudgetPaceBanner = ({ projection, currencySymbol, onPress }: Props) => {
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
            <BudgetPaceCategoryBanner categoryId={target.categoryId} scope={scope} currencySymbol={currencySymbol} onPress={handlePress} />
        );
    }

    return <BudgetPaceBannerCard title={t`Other`} scope={scope} currencySymbol={currencySymbol} onPress={handlePress} />;
};
