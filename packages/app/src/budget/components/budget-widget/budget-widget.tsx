import { BudgetWidgetVariantEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { Link, router } from 'expo-router';
import { useRef } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { budgetRepository } from '../../../@generic/drizzle/db/db';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { BudgetCalculationResultInterface } from '../../interface/budget-calculation-result.interface';
import { BudgetWidgetContent } from '../budget-widget-content/budget-widget-content';
import { BudgetWidgetVariantSelectorBottomSheet } from '../budget-widget-variant-selector-bottom-sheet/budget-widget-variant-selector-bottom-sheet';

interface Props {
    readonly calculation: BudgetCalculationResultInterface | null;
    readonly isLoading: boolean;
    readonly startDate?: Date;
    readonly endDate?: Date;
    readonly variant?: BudgetWidgetVariantEnum;
    readonly budgetId?: number;
}

export const BudgetWidget = (props: Props) => {
    const { calculation, isLoading, startDate, endDate, variant = BudgetWidgetVariantEnum.COMPACT, budgetId } = props;

    const [, hapticImpact] = useVibration();

    const variantSelectorRef = useRef<BottomSheetInterface | null>(null);

    const handlePress = () => void router.push('/budget');

    const handleLongPress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        variantSelectorRef.current?.open();
    };

    const handleSelectVariant = async (selectedVariant: BudgetWidgetVariantEnum) => {
        if (isDefined(budgetId)) {
            await budgetRepository.updateById(budgetId, { widgetVariant: selectedVariant });
        }
    };

    if (isLoading) {
        return (
            <Card>
                <Text className="text-secondary-foreground">
                    <Trans>Loading budget...</Trans>
                </Text>
            </Card>
        );
    }

    if (!isDefined(calculation)) {
        return (
            <Link href="/budget/setup" asChild>
                <Card>
                    <Text className="text-primary font-medium">
                        <Trans>Set up your budget</Trans>
                    </Text>
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Track your spending and stay on target</Trans>
                    </Text>
                </Card>
            </Link>
        );
    }

    return (
        <>
            <Card onPress={handlePress} onLongPress={handleLongPress}>
                <BudgetWidgetContent calculation={calculation} startDate={startDate} endDate={endDate} variant={variant} />
            </Card>
            <BudgetWidgetVariantSelectorBottomSheet ref={variantSelectorRef} selectedVariant={variant} onSelect={handleSelectVariant} />
        </>
    );
};
