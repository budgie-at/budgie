import { budgetComputeAllocation } from '@budgie/budget';
import { BudgetLimitSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

const REMAINING_CLASS_NAME = {
    normal: 'text-primary',
    over: 'text-destructive-strong'
} as const;

const REMAINING_HEADER_TEST_ID = {
    normal: BudgetSelector.SetupAllocationSummaryRemaining,
    over: BudgetSelector.SetupAllocationSummaryOverBy
} as const;

const LARGE_TEXT_LAYOUT = { containerClassName: 'gap-y-sm', groupClassName: 'gap-y-xxs' } as const;

const DEFAULT_LAYOUT = {
    containerClassName: 'flex-row items-baseline justify-between gap-x-md',
    groupClassName: 'min-w-0 shrink flex-row items-baseline gap-x-xs'
} as const;

export const BudgetAllocationSummary = () => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const [overallLimit, otherLimit, categoryLimits, instrumentId, limitSource] = useWatch({
        control,
        name: ['overallLimit', 'otherLimit', 'categoryLimits', 'instrumentId', 'limitSource']
    });
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);
    const formatDigits = useDisplayFormatDigits();
    const layout = useIsLargeTextSize() ? LARGE_TEXT_LAYOUT : DEFAULT_LAYOUT;

    if (limitSource !== BudgetLimitSourceEnum.FIXED) {
        return null;
    }

    const allocation = budgetComputeAllocation({ overallLimit, otherLimit, categoryLimits });
    const status = allocation.isOverAllocated ? 'over' : 'normal';
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const allocatedLabel = formatDigits(allocation.allocated, currencySymbol);
    const remainingLabel = formatDigits(Math.abs(allocation.remaining), currencySymbol);
    const remainingHeader = status === 'over' ? t`Over by` : t`Remaining`;

    return (
        <View className={layout.containerClassName}>
            <View className={layout.groupClassName}>
                <Text className="text-sm text-secondary-foreground">{t`Allocated`}</Text>
                <Text
                    className="min-w-0 shrink text-sm tabular-nums text-primary"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {allocatedLabel}
                </Text>
            </View>
            <View className={layout.groupClassName}>
                <Text testID={REMAINING_HEADER_TEST_ID[status]} className="text-sm text-secondary-foreground">
                    {remainingHeader}
                </Text>
                <Text
                    className={cn('min-w-0 shrink text-sm font-semibold tabular-nums', REMAINING_CLASS_NAME[status])}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {remainingLabel}
                </Text>
            </View>
        </View>
    );
};
