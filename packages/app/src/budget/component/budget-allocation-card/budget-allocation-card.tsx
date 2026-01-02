import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';
import { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconNameEnum;
    readonly planned: number;
    readonly actual: number;
    readonly currencySymbol: string;
    readonly formatAmount: (value: number, symbol: string) => string;
    readonly onPress?: EmptyFn;
}

export const BudgetAllocationCard = (props: Props) => {
    const { categoryTitle, categoryIcon, planned, actual, currencySymbol, formatAmount, onPress } = props;

    const remaining = planned - actual;
    const isOverBudget = actual > planned;

    const amountTextClassName = cn('text-sm font-medium', isOverBudget ? 'text-warning-foreground' : 'text-primary');
    const remainingTextClassName = cn('text-xs font-medium', isOverBudget ? 'text-warning-foreground' : 'text-positive-foreground');

    return (
        <Card onPress={onPress} className="gap-3 active:scale-xs" size="md">
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-lg flex-1">
                    <CircleIcon size={32} iconSize={16} icon={categoryIcon} variant="ghost" border={false} />
                    <Text className="text-sm font-medium text-primary flex-1" numberOfLines={1}>
                        {categoryTitle}
                    </Text>
                </View>

                <Text className={amountTextClassName}>
                    {formatAmount(convertFromMicroUnits(actual), currencySymbol)} /{' '}
                    {formatAmount(convertFromMicroUnits(planned), currencySymbol)}
                </Text>
            </View>

            <BudgetProgressBar planned={planned} actual={actual} />

            <View className="flex-row justify-between">
                <Text className="text-xs text-secondary-foreground">{isOverBudget ? <Trans>Over by</Trans> : <Trans>Left</Trans>}</Text>
                <Text className={remainingTextClassName}>{formatAmount(convertFromMicroUnits(Math.abs(remaining)), currencySymbol)}</Text>
            </View>
        </Card>
    );
};
