import { convertFromMicroUnits } from '@budgie/contracts';
import { Text } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly amount: number;
    readonly symbol: string;
    readonly isIncome: boolean;
    readonly className?: string;
}

export const CategorizeInboxAmount = ({ amount, symbol, isIncome, className }: Props) => {
    const protectAmount = useProtectedAmountLabel();

    const colorClassName = isIncome ? 'text-positive-foreground' : 'text-primary';

    return (
        <Text className={cn('text-sm font-semibold tabular-nums', colorClassName, className)} numberOfLines={1}>
            {protectAmount(convertFromMicroUnits(amount), symbol)}
        </Text>
    );
};
