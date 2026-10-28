import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
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
    readonly periodEnd: Date;
    readonly onPaceHintPress: (target: BudgetHighlightTargetInterface) => void;
}

const ENTERING_DURATION = 240;
const ENTERING = FadeIn.duration(ENTERING_DURATION);

export const BudgetVerdict = ({ projection, currencySymbol, periodEnd, onPaceHintPress }: Props) => {
    const { overall, upcomingCharges, daysLeft } = projection;

    const handleFigurePress = () => void router.push('/budget-safe-to-spend');

    return (
        <Animated.View entering={ENTERING} className="gap-y-md">
            <BudgetVerdictHeader scope={overall} daysLeft={daysLeft} />

            <HapticPressable accessibilityRole="button" onPress={handleFigurePress}>
                <BudgetVerdictFigure scope={overall} currencySymbol={currencySymbol} />
            </HapticPressable>

            <BudgetVerdictOutlook scope={overall} currencySymbol={currencySymbol} periodEnd={periodEnd}>
                <BudgetPaceHint projection={projection} currencySymbol={currencySymbol} onPress={onPaceHintPress} />
            </BudgetVerdictOutlook>

            {isNotEmptyArray(upcomingCharges) ? (
                <BudgetVerdictFooter upcoming={overall.upcoming} count={upcomingCharges.length} currencySymbol={currencySymbol} />
            ) : null}
        </Animated.View>
    );
};
