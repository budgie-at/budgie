import { TagEntityInterface, TransactionFilterInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { useRouter } from 'expo-router';
import { Text, View, ViewStyle } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly title: string;
    readonly totalAmount: number;
    readonly variant: ColorPaletteVariant;
    readonly getPercentageLabel: (percentage: number) => string;
    readonly stats: { amount: number; tag: TagEntityInterface }[];
    readonly filters: TransactionFilterInterface;
    readonly isIncome: boolean;
}

const amountVariants = cva('text-xs', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
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
            pink: 'bg-pink-foreground',
            primary: 'bg-primary'
        }
    }
});

export const StatsByTags = ({ title, stats, totalAmount, variant, getPercentageLabel, filters, isIncome }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const router = useRouter();

    const renderStats = ({ tag, amount }: { tag: TagEntityInterface; amount: number }) => {
        const microAmount = convertFromMicroUnits(amount);
        const percentage = Number((totalAmount > 0 ? (microAmount / totalAmount) * 100 : 0).toFixed(2));
        const style: ViewStyle = { width: `${percentage}%` };

        const handlePress = () => {
            const params: Record<string, string> = {
                tagId: String(tag.id),
                type: isIncome ? 'income' : 'expense'
            };

            if (filters.date?.from) {
                // eslint-disable-next-line dot-notation
                params['startDate'] = filters.date.from.toISOString();
            }

            if (filters.date?.to) {
                // eslint-disable-next-line dot-notation
                params['endDate'] = filters.date.to.toISOString();
            }

            router.push({
                pathname: '/analytics/transactions',
                params
            });
        };

        return (
            <HapticPressable key={tag.id} onPress={handlePress} className="gap-y-md">
                <View className="flex-row items-center gap-x-md">
                    <View className="h-10 w-10 rounded-full bg-destructive-background border-2 border-destructive-corner items-center justify-center">
                        <View className="w-3 h-3 rounded-full bg-destructive-foreground" />
                    </View>
                    <Text className="mr-auto text-primary text-xs">{tag.title}</Text>
                    <Text className={amountVariants({ variant })}>{formatDigits(microAmount, defaultInstrument.symbol)}</Text>
                </View>

                <View className="rounded-5xl bg-secondary-corner h-2">
                    <View style={style} className={barVariants({ variant })} />
                </View>

                <Text className="text-secondary-foreground">{getPercentageLabel(percentage)}</Text>
            </HapticPressable>
        );
    };

    return (
        <View className="gap-y-md">
            <Text className="uppercase text-secondary-foreground text-xs">{title}</Text>

            <Card className="gap-y-xl">{stats.map(renderStats)}</Card>
        </View>
    );
};
