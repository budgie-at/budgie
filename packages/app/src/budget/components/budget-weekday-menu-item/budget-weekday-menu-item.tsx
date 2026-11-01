import { UserIconNameEnum } from '@budgie/contracts';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';

interface Props {
    readonly label: string;
    readonly offset: number;
    readonly isSelected: boolean;
    readonly onSelect: (offset: number) => void;
}

export const BudgetWeekdayMenuItem = ({ label, offset, isSelected, onSelect }: Props) => {
    const icon = isSelected ? UserIconNameEnum.Check : UserIconNameEnum.Calendar;
    const handlePress = () => void onSelect(offset);

    return <ActionsMenuItem icon={icon} label={label} onPress={handlePress} />;
};
