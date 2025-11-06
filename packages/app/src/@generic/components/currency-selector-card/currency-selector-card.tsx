import { CurrencyEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { ICONS } from '../../constant/icons.constant';
import { useVibration } from '../../hooks/use-vibration.hook';
import { CurrencyDetails } from '../../interface/currency-details.interface';
import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

interface Props extends CurrencyDetails {
    readonly onSelect: (currency: CurrencyEnum) => void;
    readonly isSelected: boolean;
    readonly className?: string;
}

const cardVariants = cva(`flex-1 rounded-[16px] p-[16px] border-2 border-secondary-corner items-center gap-x-[12px] flex-row`, {
    variants: {
        isSelected: {
            true: 'bg-secondary-background border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
    }
});

export const CurrencySelectorCard = ({ className, isSelected, emoji, name, onSelect, code, symbol }: Props) => {
    const [, hapticImpact] = useVibration();

    const handleSelect = () => {
        void onSelect(code);
        hapticImpact(ImpactFeedbackStyle.Light);
    };


    return (
        <Pressable disabled={isSelected} className={cn(cardVariants({ isSelected }), className)} onPress={handleSelect}>
            <View className="p-[8px] bg-secondary-background rounded-[20px]">
                <Text>{emoji}</Text>
            </View>

            <View className={'gap-y-[2px] flex-1'}>
                <Text className={'text-primary uppercase font-medium text-[16px]'}>
                    {code}

                    <Text className={'text-[20px] font-thin'}> {symbol}</Text>
                </Text>

                <Text className={'text-[14px] text-secondary-foreground'}>{name}</Text>
            </View>

            {isSelected ? (
                <View className={'bg-primary rounded-full p-[4px]'}>
                    <Icon className={'text-primary-reverse'} icon={ICONS.Check} size={16} />
                </View>
            ) : null}
        </Pressable>
    );
};
