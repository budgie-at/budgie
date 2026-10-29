import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BUDGET_PACE_STATUS_LABEL } from '../../constant/budget-pace-status-label.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
}

export const BudgetWidgetHeadline = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const statusClassName = FOREGROUND_COLOR_PALETTE[BUDGET_PACE_VARIANT[scope.status]];
    const statusLabel = t(BUDGET_PACE_STATUS_LABEL[scope.status]);
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
