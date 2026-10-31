import { convertFromMicroUnits } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ChevronLinkRow } from '../../../@generic/component/chevron-link-row/chevron-link-row';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BudgetSelector } from '../../budget.selector';
import { BudgetHeldBackNote } from '../budget-held-back-note/budget-held-back-note';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly title: string;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly onPress: () => void;
}

export const BudgetPaceHintLine = ({ title, scope, currencySymbol, onPress }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const perDayAmount = formatProtectedAmount(convertFromMicroUnits(scope.safePerDay), currencySymbol);
    const label = t`${title} is running fast. Keep it under ${perDayAmount}/day.`;

    return (
        <View className="gap-y-xxs">
            <ChevronLinkRow label={label} textClassName="text-sm text-primary" testID={BudgetSelector.DetailsPaceBanner} onPress={onPress}>
                <Trans>
                    {title} is running fast. Keep it under <Text className="text-warning-strong">{perDayAmount}/day</Text>.
                </Trans>
            </ChevronLinkRow>
            <BudgetHeldBackNote scope={scope} currencySymbol={currencySymbol} />
        </View>
    );
};
