import { Text } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';

interface Props {
    readonly amount: number;
    readonly symbol: string;
    readonly isIncome: boolean;
    readonly className?: string;
}

export const CategorizeInboxAmount = ({ amount, symbol, isIncome, className }: Props) => {
    const protectAmount = useCategorizeInboxAmountLabel();

    const colorClassName = isIncome ? 'text-positive-foreground' : 'text-primary';

    return (
        <Text className={cn('text-sm font-semibold tabular-nums', colorClassName, className)} numberOfLines={1}>
            {protectAmount(amount, symbol)}
        </Text>
    );
};
