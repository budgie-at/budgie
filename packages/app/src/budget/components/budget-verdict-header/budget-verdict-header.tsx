import { BudgetPaceStatusEnum } from '@budgie/budget';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { StatusLabel } from '../../../@generic/component/status-label/status-label';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_STATUS_LABEL } from '../../constant/budget-pace-status-label.constant';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { isBudgetTight } from '../../utils/is-budget-tight.util';

import type { BudgetProjectionInterface } from '@budgie/budget';
import type { BudgetLimitSourceEnum } from '@budgie/contracts';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly limitSource: BudgetLimitSourceEnum;
}

export const BudgetVerdictHeader = ({ projection, limitSource }: Props) => {
    const { t } = useLingui();
    const { overall: scope, daysLeft } = projection;
    const isTight = isBudgetTight(projection, limitSource);
    const statusLabel = isTight ? t`Tight` : t(BUDGET_PACE_STATUS_LABEL[scope.status]);
    const tone = isTight ? 'warning' : BUDGET_PACE_VARIANT[scope.status];
    const daysLeftLabel = t({ message: plural(daysLeft, { one: '# day left', other: '# days left' }) });
    const accessibilityLabel = t`${statusLabel}, ${daysLeftLabel}.`;

    return (
        <View accessible accessibilityLabel={accessibilityLabel} className="gap-y-sm" testID={BudgetSelector.DetailsVerdict}>
            <StatusLabel label={statusLabel} trailing={daysLeftLabel} tone={tone} testID={BudgetSelector.DetailsVerdictStatus} />

            {scope.status === BudgetPaceStatusEnum.TOO_EARLY ? (
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Too early to forecast</Trans>
                </Text>
            ) : null}
        </View>
    );
};
