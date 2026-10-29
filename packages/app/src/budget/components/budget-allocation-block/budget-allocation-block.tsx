import { budgetComputeAllocation } from '@budgie/budget';
import { BudgetLimitSourceEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { BudgetSelector } from '../../budget.selector';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly limitSource: BudgetLimitSourceEnum;
    readonly currencySymbol: string;
}

export const BudgetAllocationBlock = ({ projection, limitSource, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const allocation = budgetComputeAllocation({
        overallLimit: projection.overall.limit,
        otherLimit: projection.other.limit,
        categoryLimits: projection.categories.map(category => ({ categoryId: category.categoryId, limitAmount: category.limit }))
    });
    const title = allocation.isOverAllocated ? t`Over-assigned` : t`Unassigned`;
    const valueClassName = allocation.isOverAllocated ? 'text-destructive-foreground' : 'text-positive-foreground';
    const remainingLabel = formatDigits(convertFromMicroUnits(Math.abs(allocation.remaining)), currencySymbol);
    const incomeLabel = formatDigits(convertFromMicroUnits(projection.overall.limit), currencySymbol);
    const assignedLabel = formatDigits(convertFromMicroUnits(allocation.allocated), currencySymbol);
    const receivedNote = t`Income ${incomeLabel} received so far. ${assignedLabel} assigned to categories.`;
    const expectedNote = t`Expected income ${incomeLabel}. ${assignedLabel} assigned to categories.`;
    const note = limitSource === BudgetLimitSourceEnum.INCOME_EXPECTED ? expectedNote : receivedNote;

    return (
        <EntranceReveal step={4} className="gap-y-lg">
            <View collapsable={false} testID={BudgetSelector.DetailsAllocationBlock}>
                <SectionHeader label={t`Allocation`} />
                <View className="flex-row items-baseline justify-between gap-x-md">
                    <Text className="text-md font-medium text-primary">{title}</Text>
                    <ProtectedText
                        testID={BudgetSelector.DetailsAllocationUnassigned}
                        className={cn('text-xl font-semibold tabular-nums', valueClassName)}
                    >
                        {remainingLabel}
                    </ProtectedText>
                </View>
                <Text className="mt-sm text-xs text-secondary-foreground">{note}</Text>
            </View>
        </EntranceReveal>
    );
};
