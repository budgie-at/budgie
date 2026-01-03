import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Text } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly value: string;
    readonly subtitle?: ReactNode;
}

export const BudgetStatCard = ({ icon, label, value, subtitle }: Props) => (
    <Card className="flex-1 gap-1">
        <Icon icon={icon} size={16} className="text-secondary-foreground" />
        <Text className="text-xs text-secondary-foreground">{label}</Text>
        <Text className="text-lg font-semibold text-primary">{value}</Text>
        {subtitle}
    </Card>
);
