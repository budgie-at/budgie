import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly safeToSpend: number;
    readonly daysRemaining: number;
    readonly currencySymbol: string;
    readonly formatAmount: (value: number, symbol: string) => string;
}

export const SafeToSpendCard = ({ safeToSpend, daysRemaining, currencySymbol, formatAmount }: Props) => {
    const dailyBudget = daysRemaining > 0 ? safeToSpend / daysRemaining : 0;
    const isLow = safeToSpend < dailyBudget * 3;

    const variant: ColorPaletteVariant = isLow ? 'warning' : 'positive';
    const iconClassName = isLow ? 'text-warning-foreground' : 'text-positive-foreground';
    const titleClassName = cn('text-sm font-medium', isLow ? 'text-warning-foreground' : 'text-positive-foreground');
    const amountClassName = cn('text-3xl font-bold', isLow ? 'text-warning-foreground' : 'text-positive-foreground');
    const subtitleClassName = cn('text-xs', isLow ? 'text-warning-foreground/70' : 'text-positive-foreground/70');

    return (
        <Card className="gap-3" variant={variant}>
            <View className="flex-row items-center gap-2">
                <Icon icon={UserIconNameEnum.Wallet} size={20} className={iconClassName} />
                <Text className={titleClassName}>
                    <Trans>Safe to Spend</Trans>
                </Text>
            </View>

            <Text className={amountClassName}>{formatAmount(convertFromMicroUnits(safeToSpend), currencySymbol)}</Text>

            <View className="flex-row justify-between">
                <Text className={subtitleClassName}>{formatAmount(convertFromMicroUnits(dailyBudget), currencySymbol)}/day</Text>
                <Text className={subtitleClassName}>
                    <Trans>{daysRemaining} days left</Trans>
                </Text>
            </View>
        </Card>
    );
};
