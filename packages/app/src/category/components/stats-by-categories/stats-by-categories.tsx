import { CategoryEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { Text, View, ViewStyle } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly title: string;
    readonly totalAmount: number;
    readonly variant: ColorPaletteVariant;
    readonly getPercentageLabel: (percentage: number) => string;
    readonly stats: { amount: number; category: CategoryEntityInterface }[];
}

const amountVariants = cva('text-xs', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

const barVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('h-[8px] rounded-5xl', {
    variants: {
        variant: {
            'dark-warning': 'bg-dark-warning-foreground',
            destructive: 'bg-destructive-foreground',
            secondary: 'bg-secondary-foreground',
            positive: 'bg-positive-foreground',
            warning: 'bg-warning-foreground',
            default: 'bg-default-foreground',
            ghost: 'bg-ghost-foreground',
            pink: 'bg-pink-foreground'
        }
    }
});

export const StatsByCategories = ({ title, stats, totalAmount, variant, getPercentageLabel }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const format = useFormatMoney(decimalPlaces, defaultInstrument.code);

    const renderStats = ({ category, amount }: { category: CategoryEntityInterface; amount: number }) => {
        const percentage = Number((totalAmount > 0 ? (amount / totalAmount) * 100 : 0).toFixed(2));
        const style: ViewStyle = { width: `${percentage}%` };

        return (
            <View key={category.id} className="gap-y-md">
                <View className="flex-row items-center gap-x-md">
                    <CircleIcon icon={ICONS[category.icon]} variant={variant} />
                    <Text className="mr-auto text-primary text-xs">{category.title}</Text>
                    <Text className={amountVariants({ variant })}>{format(amount)}</Text>
                </View>

                <View className="rounded-5xl bg-secondary-corner h-[8px]">
                    <View style={style} className={barVariants({ variant })} />
                </View>

                <Text className="text-secondary-foreground">{getPercentageLabel(percentage)}</Text>
            </View>
        );
    };

    return (
        <View className="gap-y-md">
            <Text className="uppercase text-secondary-foreground text-xs">{title}</Text>

            <Card className="gap-y-xl">{stats.map(renderStats)}</Card>
        </View>
    );
};
