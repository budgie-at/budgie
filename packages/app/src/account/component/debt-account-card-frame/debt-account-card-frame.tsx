import { AccountEntityInterface } from '@budgie/contracts';
import { cn } from 'cn';
import { router } from 'expo-router';
import { PropsWithChildren, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title'> {
    readonly accessibilityLabel: string;
    readonly subtitle: ReactNode;
    readonly trailing: ReactNode;
    readonly className?: string;
}

export const DebtAccountCardFrame = ({
    id,
    title,
    accessibilityLabel,
    subtitle,
    trailing,
    className,
    children
}: PropsWithChildren<Props>) => {
    const handleOpenDetails = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(id) } });

    return (
        <HapticPressable
            accessible
            accessibilityRole="button"
            testID={AccountCardBaseSelector.Card(title)}
            accessibilityLabel={accessibilityLabel}
            onPress={handleOpenDetails}
            hitSlop={0}
            className={cn('gap-y-[14px] px-3xl py-xl', className)}
        >
            <View className="flex-row items-center gap-x-[14px]">
                <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ghost-background">
                    <Text className="text-base font-semibold text-primary">{title.trim().charAt(0).toLocaleUpperCase()}</Text>
                </View>
                <View className="min-w-0 flex-1 items-start gap-y-xxs">
                    <Text className="text-base font-semibold text-primary" ellipsizeMode="tail" numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle}
                </View>
                {trailing}
            </View>
            {children}
        </HapticPressable>
    );
};
