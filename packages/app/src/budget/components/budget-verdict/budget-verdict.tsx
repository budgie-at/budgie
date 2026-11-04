import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BudgetPaceHint } from '../budget-pace-hint/budget-pace-hint';
import { BudgetVerdictFigure } from '../budget-verdict-figure/budget-verdict-figure';
import { BudgetVerdictFooter } from '../budget-verdict-footer/budget-verdict-footer';
import { BudgetVerdictHeader } from '../budget-verdict-header/budget-verdict-header';

import type { BudgetDisplayStatusInterface } from '../../interface/budget-display-status.interface';
import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly displayStatus: BudgetDisplayStatusInterface;
    readonly currencySymbol: string;
    readonly onFigurePress: () => void;
    readonly onPaceHintPress?: (target: BudgetHighlightTargetInterface) => void;
}

export const BudgetVerdict = ({ projection, displayStatus, currencySymbol, onFigurePress, onPaceHintPress }: Props) => {
    const { t } = useLingui();
    const { overall, upcomingCharges } = projection;

    const paceHint = isDefined(onPaceHintPress) ? (
        <BudgetPaceHint projection={projection} currencySymbol={currencySymbol} onPress={onPaceHintPress} />
    ) : null;

    return (
        <EntranceReveal step={0} className="gap-y-md">
            <BudgetVerdictHeader projection={projection} displayStatus={displayStatus} />

            <HapticPressable
                accessibilityRole="button"
                accessibilityHint={t`Shows how this is calculated`}
                className="self-start active:opacity-70"
                onPress={onFigurePress}
            >
                <BudgetVerdictFigure scope={overall} currencySymbol={currencySymbol} />
            </HapticPressable>

            {paceHint}

            {isNotEmptyArray(upcomingCharges) ? (
                <BudgetVerdictFooter upcoming={overall.upcoming} count={upcomingCharges.length} currencySymbol={currencySymbol} />
            ) : null}
        </EntranceReveal>
    );
};
