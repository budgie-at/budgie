import { BudgetPeriodEnum, UserIconNameEnum } from '@budgie/contracts';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';

interface Props {
    readonly label: string;
    readonly period: BudgetPeriodEnum;
    readonly isSelected: boolean;
    readonly onSelect: (period: BudgetPeriodEnum) => void;
}

export const BudgetPeriodMenuItem = ({ label, period, isSelected, onSelect }: Props) => {
    const icon = isSelected ? UserIconNameEnum.Check : UserIconNameEnum.Calendar;
    const handlePress = () => void onSelect(period);

    return <ActionsMenuItem icon={icon} label={label} onPress={handlePress} />;
};
