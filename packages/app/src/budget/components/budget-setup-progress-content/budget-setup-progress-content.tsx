import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_VARIANT } from '../../constant/budget-pace-variant.constant';
import { useBudgetProgressLabels } from '../../hooks/use-budget-progress-labels.hook';
import { BudgetHeldBackNote } from '../budget-held-back-note/budget-held-back-note';
import { BudgetLimitBar } from '../budget-limit-bar/budget-limit-bar';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly scope: BudgetProjectionScopeInterface | null;
    readonly currencySymbol: string;
}

export const BudgetSetupProgressContent = ({ scope, currencySymbol }: Props) => {
    const { t } = useLingui();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);
    const spent = scope?.spent ?? 0;
    const limit = scope?.limit ?? 0;
    const free = scope?.free ?? 0;
    const { amountLabel, percentLabel } = useBudgetProgressLabels(spent, limit, currencySymbol, decimalPlaces);
    const leftLabel = free < 0 ? t`Over budget` : t`Left`;
    const leftAmount = formatDigits(convertFromMicroUnits(Math.abs(free)), currencySymbol);
    const tone = BUDGET_PACE_VARIANT[scope?.status ?? BudgetPaceStatusEnum.ON_TRACK];
    const elapsedFraction = scope?.elapsedFraction ?? 0;
    const isLoading = !isDefined(scope);

    return (
        <LoadingContent isLoading={isLoading} className="gap-y-md">
            <View className="flex-row items-center justify-between">
                <ProtectedText className="text-primary text-md font-semibold tabular-nums" testID={BudgetSelector.SetupSpentLabel}>
                    {amountLabel}
                </ProtectedText>
                <Text className="text-secondary-foreground text-sm tabular-nums">{percentLabel}</Text>
            </View>

            <BudgetLimitBar spent={spent} limit={limit} tone={tone} elapsedFraction={elapsedFraction} />

            <View className="flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-sm">{leftLabel}</Text>
                <ProtectedText testID={BudgetSelector.SetupRemainingLabel} className="text-primary text-md font-semibold tabular-nums">
                    {leftAmount}
                </ProtectedText>
            </View>

            {isDefined(scope) ? <BudgetHeldBackNote scope={scope} currencySymbol={currencySymbol} /> : null}
        </LoadingContent>
    );
};
