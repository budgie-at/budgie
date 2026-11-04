import { budgetComputeAllocation } from '@budgie/budget';
import { Trans } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetEventAllocationNote = ({ currencySymbol }: Props) => {
    const { control } = useFormContext<BudgetEventFormValues>();
    const [overallLimit, categoryLimits] = useWatch({ control, name: ['overallLimit', 'categoryLimits'] });
    const formatDigits = useDisplayFormatDigits();
    const { remaining, isOverAllocated } = budgetComputeAllocation({ overallLimit, otherLimit: 0, categoryLimits });
    const amountLabel = formatDigits(Math.abs(remaining), currencySymbol);

    if (isOverAllocated) {
        return (
            <Text className="text-destructive-strong px-3xl pt-md text-[13px] leading-[18px]">
                <Trans>Category limits are {amountLabel} over the event limit.</Trans>
            </Text>
        );
    }

    return (
        <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
            <Trans>
                <Text className="font-semibold tabular-nums text-primary">{amountLabel}</Text> left for everything else.
            </Trans>
        </Text>
    );
};
