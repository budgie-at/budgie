import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

type AllocationStatus = 'normal' | 'over';

const containerVariants = cva<{ status: Record<AllocationStatus, string> }>(
    'flex-row items-center justify-between rounded-2xl border px-xl py-md',
    {
        variants: {
            status: {
                normal: 'bg-secondary-background border-secondary-corner',
                over: 'bg-destructive-background border-destructive-corner'
            }
        }
    }
);

const remainingTextVariants = cva<{ status: Record<AllocationStatus, string> }>('text-md font-semibold', {
    variants: {
        status: {
            normal: 'text-positive-foreground',
            over: 'text-destructive-foreground'
        }
    }
});

export const BudgetAllocationSummary = () => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const overallLimit = useWatch<BudgetFormValues, 'overallLimit'>({ control, name: 'overallLimit' });
    const categoryLimits = useWatch<BudgetFormValues, 'categoryLimits'>({ control, name: 'categoryLimits' });
    const instrumentId = useWatch<BudgetFormValues, 'instrumentId'>({ control, name: 'instrumentId' });
    const { instrument } = useGetInstrumentByIdQuery(instrumentId);

    const allocated = categoryLimits.reduce((sum, limit) => sum + limit.limitAmount, 0);
    const remaining = overallLimit - allocated;
    const status: AllocationStatus = remaining < 0 ? 'over' : 'normal';
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const allocatedLabel = `${allocated.toFixed(2)} ${currencySymbol}`.trim();
    const remainingLabel = `${remaining.toFixed(2)} ${currencySymbol}`.trim();
    const remainingHeader = status === 'over' ? t`Over by` : t`Remaining`;

    return (
        <View className={containerVariants({ status })}>
            <View>
                <Text className="text-secondary-foreground text-xs">{t`Allocated`}</Text>
                <Text className="text-primary text-md font-semibold">{allocatedLabel}</Text>
            </View>
            <View className="items-end">
                <Text className="text-secondary-foreground text-xs">{remainingHeader}</Text>
                <Text className={remainingTextVariants({ status })}>{remainingLabel}</Text>
            </View>
        </View>
    );
};
