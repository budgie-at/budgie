import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: ReactNode;
    readonly description: ReactNode;
}

export const AccountsEmptyStateBase = ({ icon, title, description }: Props) => (
    <View className="flex-1 items-center justify-center max-w-63.75 mx-auto">
        <View className="bg-dark-warning-background border border-dark-warning-corner rounded-7xl w-29 h-29 items-center justify-center mb-7xl">
            <Icon icon={icon} size={64} className="text-dark-warning-foreground" />
        </View>
        <Text className="text-primary text-center text-3xl font-medium mb-md">{title}</Text>
        <Text className="text-secondary-foreground text-center text-sm">{description}</Text>
    </View>
);
