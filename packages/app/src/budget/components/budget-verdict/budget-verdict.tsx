import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BudgetPaceHint } from '../budget-pace-hint/budget-pace-hint';
import { BudgetPaceTicks } from '../budget-pace-ticks/budget-pace-ticks';
import { BudgetPaceTrack } from '../budget-pace-track/budget-pace-track';
import { BudgetVerdictFigure } from '../budget-verdict-figure/budget-verdict-figure';
import { BudgetVerdictFooter } from '../budget-verdict-footer/budget-verdict-footer';
import { BudgetVerdictHeader } from '../budget-verdict-header/budget-verdict-header';
import { BudgetVerdictOutlook } from '../budget-verdict-outlook/budget-verdict-outlook';

import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly onPaceHintPress: (target: BudgetHighlightTargetInterface) => void;
}

const ENTERING_DURATION = 240;
const ENTERING = FadeIn.duration(ENTERING_DURATION);

export const BudgetVerdict = ({ projection, currencySymbol, periodStart, periodEnd, onPaceHintPress }: Props) => {
    const { overall, upcomingCharges, daysLeft } = projection;

    const handleFigurePress = () => void router.push('/budget-safe-to-spend');

    return (
        <Animated.View entering={ENTERING}>
            <Card className="gap-y-lg">
                <BudgetVerdictHeader scope={overall} daysLeft={daysLeft} />

                <HapticPressable accessibilityRole="button" className="gap-y-lg" onPress={handleFigurePress}>
                    <BudgetVerdictFigure scope={overall} currencySymbol={currencySymbol} />
                    <BudgetVerdictOutlook scope={overall} currencySymbol={currencySymbol} periodEnd={periodEnd} />
                </HapticPressable>

                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <BudgetPaceTrack scope={overall} />
                    <BudgetPaceTicks periodStart={periodStart} periodEnd={periodEnd} elapsedFraction={overall.elapsedFraction} />
                </View>

                <BudgetPaceHint projection={projection} currencySymbol={currencySymbol} onPress={onPaceHintPress} />

                {isNotEmptyArray(upcomingCharges) ? (
                    <BudgetVerdictFooter upcoming={overall.upcoming} count={upcomingCharges.length} currencySymbol={currencySymbol} />
                ) : null}
            </Card>
        </Animated.View>
    );
};
