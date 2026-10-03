import { AccountEntityInterface } from '@budgie/contracts';
import { cn } from 'cn';
import { router } from 'expo-router';
import { PropsWithChildren, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';
import { AccountEditButton } from '../account-edit-button/account-edit-button';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly accessibilityLabel: string;
    readonly subtitle: ReactNode;
    readonly trailing: ReactNode;
    readonly className?: string;
}

export const DebtAccountCardFrame = ({
    id,
    title,
    icon,
    accessibilityLabel,
    subtitle,
    trailing,
    className,
    children
}: PropsWithChildren<Props>) => {
    const navigateToAccount = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(id) } });

    return (
        <Card
            accessible
            testID={AccountCardBaseSelector.Card(title)}
            accessibilityLabel={accessibilityLabel}
            onPress={navigateToAccount}
            className={cn('flex-none gap-y-lg overflow-hidden px-3xl py-xl active:scale-xs', className)}
        >
            <View className="flex-row items-center gap-x-md">
                <CircleIcon size={36} iconSize={20} icon={icon} variant="ghost" border={false} />

                <View className="min-w-0 flex-1 items-start gap-y-xs">
                    <Text className="text-sm font-medium text-primary" ellipsizeMode="tail" numberOfLines={1}>
                        {title}
                    </Text>

                    {subtitle}
                </View>

                {trailing}

                <AccountEditButton id={id} className="-mr-xs p-xs" />
            </View>

            {children}
        </Card>
    );
};
