import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { findRiskiestAheadScope } from '../../utils/find-riskiest-ahead-scope.util';
import { BudgetPaceHint } from '../budget-pace-hint/budget-pace-hint';
import { BudgetVerdictFigure } from '../budget-verdict-figure/budget-verdict-figure';
import { BudgetVerdictFooter } from '../budget-verdict-footer/budget-verdict-footer';
import { BudgetVerdictHeader } from '../budget-verdict-header/budget-verdict-header';
import { BudgetVerdictOutlook } from '../budget-verdict-outlook/budget-verdict-outlook';

import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
    readonly onFigurePress?: () => void;
    readonly onPaceHintPress?: (target: BudgetHighlightTargetInterface) => void;
}

export const BudgetVerdict = ({ projection, currencySymbol, onFigurePress, onPaceHintPress }: Props) => {
    const { overall, upcomingCharges, daysLeft } = projection;

    const hasPaceHint = isDefined(onPaceHintPress) && isDefined(findRiskiestAheadScope(projection));

    const outlook = hasPaceHint ? (
        <BudgetPaceHint projection={projection} currencySymbol={currencySymbol} onPress={onPaceHintPress} />
    ) : (
        <BudgetVerdictOutlook scope={overall} currencySymbol={currencySymbol} />
    );

    const verdictFigure = <BudgetVerdictFigure scope={overall} currencySymbol={currencySymbol} />;

    const figure = isDefined(onFigurePress) ? (
        <HapticPressable accessibilityRole="button" onPress={onFigurePress}>
            {verdictFigure}
        </HapticPressable>
    ) : (
        verdictFigure
    );

    return (
        <EntranceReveal step={0} className="gap-y-md">
            <BudgetVerdictHeader scope={overall} daysLeft={daysLeft} />

            {figure}

            {outlook}

            {isNotEmptyArray(upcomingCharges) ? (
                <BudgetVerdictFooter upcoming={overall.upcoming} count={upcomingCharges.length} currencySymbol={currencySymbol} />
            ) : null}
        </EntranceReveal>
    );
};
