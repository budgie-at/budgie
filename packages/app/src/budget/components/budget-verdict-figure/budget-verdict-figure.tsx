import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetVerdictFigure = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const isOver = scope.status === BudgetPaceStatusEnum.OVER;
    const safePerDayAmount = formatProtectedAmount(convertFromMicroUnits(scope.safePerDay), currencySymbol);
    const overAmount = formatProtectedAmount(convertFromMicroUnits(scope.spent - scope.limit), currencySymbol);
    const mainLabel = isOver ? t`${overAmount} over` : safePerDayAmount;
    const mainClassName = isOver ? 'text-destructive-foreground' : 'text-primary';

    return (
        <View className="flex-row items-baseline gap-x-sm">
            <ProtectedText className={cn('text-3xl font-bold tabular-nums', mainClassName)}>{mainLabel}</ProtectedText>
            {isOver ? null : (
                <Text className="text-md text-secondary-foreground">
                    <Trans>/ day</Trans>
                </Text>
            )}
        </View>
    );
};
