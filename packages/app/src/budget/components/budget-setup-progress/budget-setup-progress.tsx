import { BudgetLimitSourceEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { useBudgetProgressLabels } from '../../hooks/use-budget-progress-labels.hook';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { BudgetHeldBackNote } from '../budget-held-back-note/budget-held-back-note';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly currencySymbol: string;
}

export const BudgetSetupProgress = ({ budget, currencySymbol }: Props) => {
    const { t } = useLingui();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);
    const { projection } = useGetBudgetProjectionQuery(budget);
    const { overall } = projection;
    const { amountLabel, percentLabel } = useBudgetProgressLabels(overall.spent, overall.limit, currencySymbol, decimalPlaces);

    if (budget.limitSource !== BudgetLimitSourceEnum.FIXED) {
        return null;
    }

    const leftLabel = overall.free < 0 ? t`Over budget` : t`Left`;
    const leftAmount = formatDigits(convertFromMicroUnits(Math.abs(overall.free)), currencySymbol);

    return (
        <View className="gap-y-md">
            <View className="flex-row items-center justify-between">
                <ProtectedText className="text-primary text-md font-semibold tabular-nums" testID={BudgetSelector.SetupSpentLabel}>
                    {amountLabel}
                </ProtectedText>
                <Text className="text-secondary-foreground text-sm tabular-nums">{percentLabel}</Text>
            </View>

            <BudgetLimitBar
                spent={overall.spent}
                limit={overall.limit}
                tone={BUDGET_PACE_VARIANT[overall.status]}
                elapsedFraction={overall.elapsedFraction}
            />

            <View className="flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-sm">{leftLabel}</Text>
                <ProtectedText testID={BudgetSelector.SetupRemainingLabel} className="text-primary text-md font-semibold tabular-nums">
                    {leftAmount}
                </ProtectedText>
            </View>

            <BudgetHeldBackNote scope={overall} currencySymbol={currencySymbol} />
        </View>
    );
};
