import { InstrumentEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { ICONS } from '../../constant/icons.constant';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props extends Pick<InstrumentEntityInterface, 'id' | 'code' | 'symbol' | 'name'> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly className?: string;
}

const cardVariants = cva(`rounded-3xl p-3xl border-2 border-secondary-corner items-center gap-x-xl flex-row`, {
    variants: {
        isSelected: {
            true: 'bg-secondary-background/30 border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
    }
});

export const CurrencySelectorCard = ({ className, isSelected, name, onSelect, code, symbol, id }: Props) => {
    const handleSelect = () => void onSelect(id);

    return (
        <HapticPressable disabled={isSelected} className={cn(cardVariants({ isSelected }), className)} onPress={handleSelect}>
            <View className="w-[48px] h-[48px] bg-secondary-background rounded-5xl items-center justify-center">
                <Text className="text-primary text-md">{symbol}</Text>
            </View>

            <View className="gap-y-xxs flex-1">
                <Text className="text-primary uppercase font-medium text-md">
                    {code}

                    <Text className="text-xl font-thin text-secondary-foreground"> {symbol}</Text>
                </Text>

                <Text className="text-sm text-secondary-foreground">{name}</Text>
            </View>

            {isSelected ? (
                <View className="bg-primary rounded-full p-xs">
                    <Icon className="text-primary-reverse" icon={ICONS.Check} size={16} />
                </View>
            ) : null}
        </HapticPressable>
    );
};
