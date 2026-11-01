import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { buildBudgetProgressBarMetrics } from '../utils/build-budget-progress-bar-metrics.util';

export const useBudgetProgressLabels = (spent: number, limit: number, currencySymbol: string, decimalPlaces: number) => {
    const formatDigits = useFormatDigits(decimalPlaces);
    const metrics = buildBudgetProgressBarMetrics(spent, limit);

    return {
        amountLabel: `${formatDigits(metrics.displaySpent, currencySymbol)} / ${formatDigits(metrics.displayLimit, currencySymbol)}`,
        percentLabel: metrics.percentLabel
    };
};
