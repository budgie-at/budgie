import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';
import type { ReactNode } from 'react';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly children?: ReactNode;
}

export const BudgetVerdictFigure = ({ scope, currencySymbol, children }: Props) => {
    const { t } = useLingui();
    const isOver = scope.status === BudgetPaceStatusEnum.OVER;
    const figureAmount = isOver ? scope.spent - scope.limit : scope.safePerDay;
    const unit = isOver ? t`over` : t`/ day`;
    const caption = isOver ? t`Over your limit this period` : t`Safe to spend today`;

    return (
        <View className="gap-y-xxs">
            <HeroFigure amount={convertFromMicroUnits(figureAmount)} currencySymbol={currencySymbol} variant="primary" unit={unit} />
            <View className="flex-row items-center gap-x-xs">
                <Text className="text-sm text-secondary-foreground">{caption}</Text>
                {children}
            </View>
        </View>
    );
};
