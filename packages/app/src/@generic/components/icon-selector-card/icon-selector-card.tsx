import { AccountTypeEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { ACCOUNT_COLOR } from '../../../@account/constant/account-color.constant';
import { useVibration } from '../../hooks/use-vibration.hook';
import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

import type { IconName, IconType } from '../../constant/icons.constant';

interface Props {
    readonly onSelect: (name: IconName) => void;
    readonly accountType: AccountTypeEnum;
    readonly isSelected: boolean;
    readonly className?: string;
    readonly icon: IconType;
    readonly name: IconName;
}

const selectorVariants = cva(`flex-1 rounded-[16px] py-[16px] border-2 border-secondary-corner items-center gap-y-[8px]`, {
    variants: {
        isSelected: {
            true: 'bg-secondary-background border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
    }
});

const iconVariant = cva('', {
    variants: {
        accountType: {
            [AccountTypeEnum.BANK]: '',
            [AccountTypeEnum.CASH]: '',
            [AccountTypeEnum.CRYPTO]: '',
            [AccountTypeEnum.STOCKS]: ''
        },
        isSelected: { false: 'text-primary' }
    },
    compoundVariants: [
        {
            isSelected: true,
            accountType: AccountTypeEnum.BANK,
            className: ACCOUNT_COLOR.BANK
        },
        {
            isSelected: true,
            accountType: AccountTypeEnum.CASH,
            className: ACCOUNT_COLOR.CASH
        },
        {
            isSelected: true,
            accountType: AccountTypeEnum.CRYPTO,
            className: ACCOUNT_COLOR.CRYPTO
        },
        {
            isSelected: true,
            accountType: AccountTypeEnum.STOCKS,
            className: ACCOUNT_COLOR.STOCKS
        }
    ]
});

const nameVariants = cva('font-medium text-[10px] px-[10px]', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const IconSelectorCard = ({ className, isSelected, icon, name, onSelect, accountType }: Props) => {
    const [, hapticImpact] = useVibration();

    const handleSelect = () => {
        onSelect(name);
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    return (
        <Pressable className={cn(selectorVariants({ isSelected }), className)} onPress={handleSelect}>
            <View className="p-[8px]">
                <Icon className={iconVariant({ accountType, isSelected })} icon={icon} />
            </View>

            <Text className={nameVariants({ isSelected })} ellipsizeMode="tail" numberOfLines={1}>
                {name}
            </Text>
        </Pressable>
    );
};
