import { BudgetLimitSourceEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { BudgetSelector } from '../../budget.selector';
import { computeProjectionAllocation } from '../../utils/compute-projection-allocation.util';

import type { BudgetProjectionInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly budget: Pick<BudgetEntityInterface, 'id' | 'limitSource'>;
    readonly currencySymbol: string;
}

export const BudgetAllocationBlock = ({ projection, budget, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const allocation = computeProjectionAllocation(projection);
    const remainingLabel = formatDigits(convertFromMicroUnits(Math.abs(allocation.remaining)), currencySymbol);
    const incomeLabel = formatDigits(convertFromMicroUnits(projection.overall.limit), currencySymbol);
    const assignedLabel = formatDigits(convertFromMicroUnits(allocation.allocated), currencySymbol);
    const receivedNote = t`Income ${incomeLabel} received so far. ${assignedLabel} assigned to categories.`;
    const expectedNote = t`Expected income ${incomeLabel}. ${assignedLabel} assigned to categories.`;
    const note = budget.limitSource === BudgetLimitSourceEnum.INCOME_EXPECTED ? expectedNote : receivedNote;
    const icon = allocation.isOverAllocated ? UserIconNameEnum.TriangleAlert : UserIconNameEnum.Scale;
    const title = allocation.isOverAllocated ? t`Over-assigned by ${remainingLabel}` : t`Unassigned ${remainingLabel}`;
    const titleClassName = allocation.isOverAllocated ? 'text-destructive-strong font-medium' : 'font-medium';
    const iconClassName = allocation.isOverAllocated ? 'text-destructive-strong' : 'text-secondary-foreground';

    const handleAdjustPress = () => {
        router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });
    };

    return (
        <EntranceReveal step={2}>
            <View collapsable={false} testID={BudgetSelector.DetailsAllocationBlock}>
                <GroupedListSection>
                    <GroupedListRow
                        left={<GroupedListIcon icon={icon} iconClassName={iconClassName} />}
                        title={title}
                        titleClassName={titleClassName}
                        titleTestID={BudgetSelector.DetailsAllocationUnassigned}
                        subtitle={note}
                    />
                    {allocation.isOverAllocated ? (
                        <GroupedListRow
                            title={t`Adjust category limits`}
                            titleClassName="text-default-foreground"
                            onPress={handleAdjustPress}
                        />
                    ) : null}
                </GroupedListSection>
            </View>
        </EntranceReveal>
    );
};
