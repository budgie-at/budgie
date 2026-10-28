import { BudgetPaceStatusEnum } from '@budgie/budget';
import { UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_ICON } from '../../constant/budget-pace-icon.constant';
import { BUDGET_PACE_STATUS_LABEL } from '../../constant/budget-pace-status-label.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly daysLeft: number;
    readonly currencySymbol: string;
}

const STATUS_ICON_SIZE = 18;
const NOTE_ICON_SIZE = 14;

export const BudgetVerdictHeader = ({ scope, daysLeft, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const statusClassName = FOREGROUND_COLOR_PALETTE[BUDGET_PACE_VARIANT[scope.status]];
    const statusLabel = t(BUDGET_PACE_STATUS_LABEL[scope.status]);
    const daysLeftLabel = t({ message: plural(daysLeft, { one: '# day left', other: '# days left' }) });
    const safePerDayAmount = formatProtectedAmount(convertFromMicroUnits(scope.safePerDay), currencySymbol);
    const overAmount = formatProtectedAmount(convertFromMicroUnits(scope.spent - scope.limit), currencySymbol);
    const figureAccessibilityLabel = scope.status === BudgetPaceStatusEnum.OVER ? t`${overAmount} over` : t`${safePerDayAmount} per day`;
    const accessibilityLabel = t`${statusLabel}. ${figureAccessibilityLabel}, ${daysLeftLabel}.`;

    return (
        <View accessible accessibilityLabel={accessibilityLabel} className="gap-y-sm" testID={BudgetSelector.DetailsVerdict}>
            <View className="flex-row items-center justify-between gap-x-md">
                <View className="flex-row items-center gap-x-sm shrink">
                    <Icon icon={BUDGET_PACE_ICON[scope.status]} size={STATUS_ICON_SIZE} className={cn(statusClassName)} />
                    <Text testID={BudgetSelector.DetailsVerdictStatus} className={cn('text-md font-semibold', statusClassName)}>
                        {statusLabel}
                    </Text>
                </View>
                <MetaPill label={daysLeftLabel} icon={UserIconNameEnum.CalendarDays} />
            </View>

            {scope.status === BudgetPaceStatusEnum.TOO_EARLY ? (
                <View className="flex-row items-center gap-x-xs">
                    <Icon icon={UserIconNameEnum.Hourglass} size={NOTE_ICON_SIZE} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Too early to forecast</Trans>
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
