import { budgetComputeAllocation } from '@budgie/budget';
import { BudgetLimitSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

const REMAINING_CLASS_NAME = {
    normal: 'text-primary',
    over: 'text-destructive-strong'
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

    if (limitSource !== BudgetLimitSourceEnum.FIXED) {
        return null;
    }

    const allocation = budgetComputeAllocation({ overallLimit, otherLimit, categoryLimits });
    const status = allocation.isOverAllocated ? 'over' : 'normal';
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const allocatedLabel = formatDigits(allocation.allocated, currencySymbol);
    const remainingLabel = formatDigits(Math.abs(allocation.remaining), currencySymbol);
    const remainingHeader = status === 'over' ? t`Over by` : t`Remaining`;
    const remainingHeaderTestID =
        status === 'over' ? BudgetSelector.SetupAllocationSummaryOverBy : BudgetSelector.SetupAllocationSummaryRemaining;

    return (
        <View className="flex-row items-baseline justify-between gap-x-md">
            <View className="shrink flex-row items-baseline gap-x-xs">
                <Text className="text-sm text-secondary-foreground">{t`Allocated`}</Text>
                <Text className="text-sm tabular-nums text-primary">{allocatedLabel}</Text>
            </View>
            <View className="flex-row items-baseline gap-x-xs">
                <Text testID={remainingHeaderTestID} className="text-sm text-secondary-foreground">
                    {remainingHeader}
                </Text>
                <Text className={cn('text-sm font-semibold tabular-nums', REMAINING_CLASS_NAME[status])}>{remainingLabel}</Text>
            </View>
        </View>
    );
};
