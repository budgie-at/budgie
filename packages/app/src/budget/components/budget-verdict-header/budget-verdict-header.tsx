import { BudgetPaceStatusEnum } from '@budgie/budget';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { StatusLabel } from '../../../@generic/component/status-label/status-label';
import { BudgetSelector } from '../../budget.selector';

import type { BudgetDisplayStatusInterface } from '../../interface/budget-display-status.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: Pick<BudgetProjectionInterface, 'overall' | 'daysLeft'>;
    readonly displayStatus: BudgetDisplayStatusInterface;
}

export const BudgetVerdictHeader = ({ projection, displayStatus }: Props) => {
    const { t } = useLingui();
    const { overall: scope, daysLeft } = projection;
    const statusLabel = t(displayStatus.label);
    const daysLeftLabel = t({ message: plural(daysLeft, { one: '# day left', other: '# days left' }) });
    const accessibilityLabel = t`${statusLabel}, ${daysLeftLabel}.`;

    return (
        <View accessible accessibilityLabel={accessibilityLabel} className="gap-y-sm" testID={BudgetSelector.DetailsVerdict}>
            <StatusLabel
                label={statusLabel}
                trailing={daysLeftLabel}
                tone={displayStatus.tone}
                testID={BudgetSelector.DetailsVerdictStatus}
            />

            {scope.status === BudgetPaceStatusEnum.TOO_EARLY ? (
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Too early to forecast</Trans>
                </Text>
            ) : null}
        </View>
    );
};
