import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { BudgetSelector } from '../../budget.selector';
import { useFormatBudgetAmount } from '../../hooks/use-format-budget-amount.hook';

import type { BudgetProjectionInterface } from '@budgie/budget';

const WHOLE_UNITS_THRESHOLD = 100;
const CENTS_MULTIPLIER = 100;

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

export const BudgetWidgetFooterRow = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatBudgetAmount = useFormatBudgetAmount();
    const formatWhole = useFormatDigits(0);
    const { overall, daysLeft } = projection;
    const isOverBudget = overall.spent > overall.limit;
    const safePerDay = convertFromMicroUnits(Math.max(overall.safePerDay, 0));
    const flooredSafePerDay =
        safePerDay >= WHOLE_UNITS_THRESHOLD ? Math.floor(safePerDay) : Math.floor(safePerDay * CENTS_MULTIPLIER) / CENTS_MULTIPLIER;
    const safePerDayAmount = formatBudgetAmount(flooredSafePerDay, currencySymbol);
    const spentAmount = formatWhole(convertFromMicroUnits(overall.spent), currencySymbol);
    const daysLabel = t({ message: plural(daysLeft, { one: '# day left', other: '# days left' }) });
    const perDayLabel = t`${safePerDayAmount} a day`;
    const spentLabel = t`${spentAmount} spent`;
    const reservedAmount = formatWhole(convertFromMicroUnits(overall.upcoming), currencySymbol);
    const reservedLabel = t`${reservedAmount} reserved for upcoming bills`;

    return (
        <View className="gap-y-xxs">
            {isOverBudget ? (
                <View className="flex-row items-center justify-between gap-x-md">
                    <ProtectedText testID={BudgetSelector.WidgetSpentLabel} className="text-primary text-sm font-semibold tabular-nums">
                        {spentLabel}
                    </ProtectedText>
                    <Text testID={BudgetSelector.WidgetRemainingLabel} className="text-secondary-foreground text-sm">
                        {daysLabel}
                    </Text>
                </View>
            ) : (
                <View className="flex-row items-center justify-between gap-x-md">
                    <View className="shrink flex-row items-center gap-x-xs">
                        <ProtectedText
                            testID={BudgetSelector.WidgetRemainingLabel}
                            className="text-primary text-sm font-semibold tabular-nums"
                        >
                            {perDayLabel}
                        </ProtectedText>
                        <Text className="text-secondary-foreground text-sm tabular-nums" numberOfLines={1}>
                            {`· ${daysLabel}`}
                        </Text>
                    </View>
                    <ProtectedText testID={BudgetSelector.WidgetSpentLabel} className="text-secondary-foreground text-sm tabular-nums">
                        {spentLabel}
                    </ProtectedText>
                </View>
            )}
            {isPositiveNumber(overall.upcoming) && !isOverBudget ? (
                <ProtectedText className="text-secondary-foreground text-xs tabular-nums">{reservedLabel}</ProtectedText>
            ) : null}
        </View>
    );
};
