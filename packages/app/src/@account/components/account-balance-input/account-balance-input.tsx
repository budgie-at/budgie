import { AccountTypeEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, TextInput, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';

interface Props {
    accountType: AccountTypeEnum;
    textClassName?: string;
    className?: string;
    minValue?: number;
    maxValue?: number;
    value?: number;
    onChange?: (value: number) => void;
}

const textVariant = cva('text-[48px]', {
    variants: {
        accountType: ACCOUNT_COLOR
    }
});

export const AccountBalanceInput = ({ accountType, className, textClassName }: Props) => (
    <View className={cn('flex-row items-center gap-x-[12px] justify-center', className)}>
        <Text className={cn(textVariant({ accountType }), textClassName)}>$</Text>
        <TextInput className={cn('text-[72px] text-primary placeholder-secondary-reverse-foreground', textClassName)} placeholder={'0.00'} keyboardType="numeric" />
    </View>
);
