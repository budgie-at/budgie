import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
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
    const rowClassName = useIsLargeTextSize() ? 'gap-y-xs' : 'flex-row items-center justify-between gap-x-md';

    return (
        <LoadingContent isLoading={isLoading} className="gap-y-md">
            <View className={rowClassName}>
                <ProtectedText
                    className="min-w-0 shrink text-md font-semibold tabular-nums text-primary"
                    testID={BudgetSelector.SetupSpentLabel}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {amountLabel}
                </ProtectedText>
                <Text className="shrink-0 text-sm tabular-nums text-secondary-foreground">{percentLabel}</Text>
            </View>

            <BudgetLimitBar spent={spent} limit={limit} tone={tone} elapsedFraction={elapsedFraction} />

            <View className={rowClassName}>
                <Text className="shrink text-sm text-secondary-foreground">{leftLabel}</Text>
                <ProtectedText
                    testID={BudgetSelector.SetupRemainingLabel}
                    className="min-w-0 shrink text-md font-semibold tabular-nums text-primary"
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {leftAmount}
                </ProtectedText>
            </View>

            {isDefined(scope) ? <BudgetHeldBackNote scope={scope} currencySymbol={currencySymbol} /> : null}
        </LoadingContent>
    );
};
