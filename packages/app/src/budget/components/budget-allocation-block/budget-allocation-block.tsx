import { BudgetLimitSourceEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
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
    const formatWholeDigits = useFormatDigits(0);
    const allocation = computeProjectionAllocation(projection);
    const remainingLabel = formatDigits(convertFromMicroUnits(Math.abs(allocation.remaining)), currencySymbol);
    const incomeLabel = formatWholeDigits(convertFromMicroUnits(projection.overall.limit), currencySymbol);
    const assignedLabel = formatWholeDigits(convertFromMicroUnits(allocation.allocated), currencySymbol);
    const note =
        budget.limitSource === BudgetLimitSourceEnum.INCOME_EXPECTED
            ? t`${assignedLabel} assigned · ${incomeLabel} expected`
            : t`${assignedLabel} assigned · ${incomeLabel} received`;
    const icon = allocation.isOverAllocated ? UserIconNameEnum.TriangleAlert : UserIconNameEnum.Scale;
    const title = allocation.isOverAllocated ? t`Over-assigned by ${remainingLabel}` : t`Unassigned ${remainingLabel}`;
    const titleClassName = allocation.isOverAllocated
        ? 'text-destructive-strong font-medium text-[17px]'
        : 'text-primary font-medium text-[17px]';
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
                        title={
                            <Text className={titleClassName} numberOfLines={2} testID={BudgetSelector.DetailsAllocationUnassigned}>
                                {title}
                            </Text>
                        }
                        subtitle={note}
                    />
                    {allocation.isOverAllocated ? (
                        <GroupedListRow
                            title={
                                <Text className="text-default-foreground text-[17px]" numberOfLines={2}>
                                    {t`Adjust category limits`}
                                </Text>
                            }
                            onPress={handleAdjustPress}
                        />
                    ) : null}
                </GroupedListSection>
            </View>
        </EntranceReveal>
    );
};
