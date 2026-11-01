import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_PACE_TEXT_CLASS_NAME } from '../../constant/budget-pace-text-class-name.constant';

import type { BudgetDisplayStatusInterface } from '../../interface/budget-display-status.interface';
import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly displayStatus: BudgetDisplayStatusInterface;
    readonly currencySymbol: string;
}

export const BudgetWidgetHeadline = ({ scope, displayStatus, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const statusClassName = BUDGET_PACE_TEXT_CLASS_NAME[displayStatus.tone];
    const statusLabel = t(displayStatus.label);
    const safePerDayAmount = formatProtectedAmount(convertFromMicroUnits(scope.safePerDay), currencySymbol);

    return (
        <View className="flex-row items-center justify-between gap-x-md">
            <View className="flex-row items-baseline gap-x-sm shrink">
                <ProtectedText className="text-3xl font-bold tabular-nums text-primary">{safePerDayAmount}</ProtectedText>
                <Text className="text-md font-medium text-secondary-foreground">
                    <Trans>/ day</Trans>
                </Text>
            </View>
            <Text className={cn('text-sm font-semibold', statusClassName)}>{statusLabel}</Text>
        </View>
    );
};
