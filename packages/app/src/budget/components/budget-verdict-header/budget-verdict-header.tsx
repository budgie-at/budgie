import { BudgetPaceStatusEnum } from '@budgie/budget';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_STATUS_LABEL } from '../../constant/budget-pace-status-label.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface;
    readonly daysLeft: number;
}

export const BudgetVerdictHeader = ({ scope, daysLeft }: Props) => {
    const { t } = useLingui();
    const statusClassName = FOREGROUND_COLOR_PALETTE[BUDGET_PACE_VARIANT[scope.status]];
    const statusLabel = t(BUDGET_PACE_STATUS_LABEL[scope.status]);
    const daysLeftLabel = t({ message: plural(daysLeft, { one: '# day left', other: '# days left' }) });
    const accessibilityLabel = t`${statusLabel}, ${daysLeftLabel}.`;

    return (
        <View accessible accessibilityLabel={accessibilityLabel} className="gap-y-sm" testID={BudgetSelector.DetailsVerdict}>
            <Text testID={BudgetSelector.DetailsVerdictStatus} className={cn('text-md font-semibold', statusClassName)}>
                {statusLabel}
            </Text>

            {scope.status === BudgetPaceStatusEnum.TOO_EARLY ? (
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Too early to forecast</Trans>
                </Text>
            ) : null}
        </View>
    );
};
